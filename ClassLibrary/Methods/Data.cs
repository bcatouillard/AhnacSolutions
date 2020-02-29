using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Net.Http;
using Windows.System;
using Windows.UI.Notifications;
using System.DirectoryServices.AccountManagement;
using System.Collections.Generic;
using Windows.Data.Xml.Dom;
using ClassLibrary.Classes;
using Microsoft.Toolkit.Uwp.Notifications;
using System.IO;

namespace ClassLibrary.Methods
{
    /// <summary>
    /// Traite les données pour les Toasts
    /// </summary>
    public sealed class Data
    {
        /// <summary>
        /// Charge le JSON 
        /// </summary>
        public void LoadJson()
        {
            ///<summary>
            /// JSON local de test utilisé
            /// </summary>
            //var http = new HttpClient();
            //var url = String.Format("File:///C:/Users/bcatouillard/source/repos/AhnacSolutions/AhnacSolutions/Assets/alert.json");
            //http.BaseAddress = new Uri(url);
            //http.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            //HttpResponseMessage response = http.GetAsync(url).Result;
            //if (response.IsSuccessStatusCode)
            //{
            //    var result = "{alert: " + response.Content.ReadAsStringAsync().Result + "}";
            //    JObject data = (JObject)JsonConvert.DeserializeObject<Object>(result);
            //    JObject alertList = data;
            //    DataTreatment(alertList);
            //}

            /// <summary>
            /// JSON en ligne utilisé
            /// </summary>
            try
            {
                var http = new HttpClient();
                var url = String.Format("http://alertmanager.ahnac.com/JSON/alerts.json");
                http.BaseAddress = new Uri(url);
                http.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage response = http.GetAsync(url).Result;
                if (response.IsSuccessStatusCode)
                {
                    var result = "{alert: " + response.Content.ReadAsStringAsync().Result + "}";
                    JObject data = (JObject)JsonConvert.DeserializeObject<Object>(result);
                    JObject alertList = data;
                    DataTreatment(alertList);
                }
            }
            catch
            {
                string title = "Erreur Connexion";
                string content = "Connexion à AHNAC perdue";
                string logo = "File:///" + Path.GetFullPath("Assets") + "\\Alerts\\network_critic.png";
                string criticity = "";
                var deliverabletime = DateTimeOffset.Now;
                string link = "";
                string linkLabel = "";
                int connexion = 1;
                CreateToasts(title, content, logo, criticity, deliverabletime, link, linkLabel, connexion);
                CreateTile(title, content, logo, connexion);
            }
        }

        /// <summary>
        ///  Traite les données
        /// </summary>
        private void DataTreatment(JObject alertList)
        {
            string format = "{0:dd/MM/yyyy HH:mm:ss}";
            string title = "";
            string content = "";
            string logo = "";
            string localdate = String.Format(format, DateTime.Now);
            var hostName = System.Net.Dns.GetHostName();

            foreach (JToken alert in alertList["alert"])
            {
                string startDate = String.Format(format, alert["startDate"]);
                string endDate = String.Format(format, alert["endDate"]);
                if ((DateTime.Compare(DateTime.Parse(startDate), DateTime.Parse(localdate)) <= 0 && DateTime.Compare(DateTime.Parse(localdate), DateTime.Parse(endDate)) <= 0) 
                && 
                    (alert["status"]!=null && (string) alert["status"] == "active")
                && (
                        (alert["pcFilter"] == null || alert["pcFilter"].Count() == 0)
                        ||
                            PcFilter(hostName, alert)
                        ||
                            AdFilter(alert)
                   )
                )
                {
                    Criticity(title, content, logo, alert);
                }
            }
        }

        /// <summary>
        /// Filtrage par PC impacté
        /// </summary>
        private bool PcFilter(string hostName, JToken alert)
        {
            Boolean pcImpacted = false;

            if (alert["pcFilter"] != null)
            {
                foreach (string pc in alert["pcFilter"])
                {
                    if (hostName.StartsWith(pc, StringComparison.OrdinalIgnoreCase))
                    {
                        pcImpacted = true;
                        break;
                    }
                }
            }
            return pcImpacted;
        }

        /// <summary>
        /// Filtrage par Groupe
        /// </summary>
        private bool AdFilter(JToken alert)
        {
            Boolean userInGroup = false;
            Boolean liste = false;
            string currentUser = KnownUserProperties.AccountName;

            PrincipalSearchResult<Principal> groups = UserPrincipal.Current.GetGroups();
            IEnumerable<string> groupNames = groups.Where(x => x.SamAccountName.Equals(alert["adGroups"])).Select(x => x.SamAccountName);

            if (alert["adGroups"] != null)
            {
                liste = true;
            }

            if (groupNames.Count() > 0 && liste == true)
            {
                userInGroup = true;
            }


            return userInGroup;
        }

        /// <summary>
        /// Niveau de Criticité de l'alerte
        /// </summary>
        private void Criticity(string title, string content, string logo, JToken alert)
        {
            if (alert["criticity"] != null)
            {
                if ((string)alert["criticity"] == Global.criticityHigh)
                {
                    string criticity = "long";
                    var deliverabletime = DateTimeOffset.Now.AddSeconds(5);
                    Link(title, content, logo, alert, criticity, deliverabletime);
                }
                else if ((string)alert["criticity"] == Global.criticityLow)
                {
                    string criticity = "short";
                    var deliverabletime = DateTimeOffset.Now.AddSeconds(15);
                    Link(title, content, logo, alert, criticity, deliverabletime);
                }
                else
                {
                    string criticity = "short";
                    var deliverabletime = DateTimeOffset.Now.AddSeconds(15);
                    Link(title, content, logo, alert, criticity, deliverabletime);
                }
            }
            else
            {
                string criticity = "short";
                var deliverabletime = DateTimeOffset.Now.AddSeconds(15);
                Link(title, content, logo, alert, criticity, deliverabletime);
            }
        }

        /// <summary>
        /// Vérifie s'il existe un lien pour l'alerte
        /// </summary>
        private void Link(string title, string content, string logo, JToken alert, string criticity, DateTimeOffset deliverabletime)
        {
            if(alert["linkLabel"] != null || alert["link"] != null && (Boolean) alert["useLink"] == true)
            {
                if (String.IsNullOrEmpty((string)alert["linkLabel"]))
                {
                    string linkLabel = "Cliquez ici";
                    string link = (string)alert["link"];
                    ContentToast(title, content, logo, alert, criticity, deliverabletime, link, linkLabel);
                }
                else
                {
                    string linkLabel = (string)alert["linkLabel"];
                    string link = (string)alert["link"];
                    ContentToast(title, content, logo, alert, criticity, deliverabletime, link, linkLabel);
                }
            }
            else
            {
                string linkLabel = "";
                string link = "";
                ContentToast(title, content, logo, alert, criticity, deliverabletime, link, linkLabel);
            }
        }

        /// <summary>
        /// Contenu du Toast
        /// </summary>
        private void ContentToast(string title, string content, string logo, JToken alert, string criticity, DateTimeOffset deliverabletime, string link, string linkLabel)
        {
            title = (string)alert["title"];
            content =  (string) alert["message"];
            logo = "File:///"+ Path.GetFullPath("Assets") + "\\Alerts\\" + alert["image"];
            int connexion = 0;
            CreateToasts(title, content, logo, criticity, deliverabletime, link, linkLabel, connexion);
        }

        /// <summary>
        ///  Créer le contenu visuel du toast 
        /// </summary>
        public void CreateToasts(string title, string content, string logo, string criticity, DateTimeOffset deliverabletime, string link, string linkLabel, int connexion)
        {
            if (connexion == 1)
            {
                ToastVisual visual = new ToastVisual()
                {
                    BindingGeneric = new ToastBindingGeneric()
                    {
                        Children =
                        {
                            new AdaptiveText()
                            {
                                Text = title
                            },

                            new AdaptiveText()
                            {
                                Text = content
                            }
                        },
                        AppLogoOverride = new ToastGenericAppLogo()
                        {
                            Source = logo
                        }
                    }
                };

                ToastContent toastContent = new ToastContent()
                {
                    Visual = visual
                };
                var toast = new ToastNotification(toastContent.GetXml());
                ToastNotificationManager.CreateToastNotifier().Show(toast);
            }
            else
            {
                string toastd = "<toast scenario='default' launch='app-defined-string'>" +
                                             "<visual>" +
                                            "<binding template='ToastGeneric'>" +
                                           "</binding>" +
                                        "</visual>" +
                                        "<actions>" +
                                        "</actions>" +
                                    "</toast>";

                XmlDocument toastXml = new XmlDocument();

                toastXml.LoadXml(toastd);

                XmlElement toastNode = (XmlElement)toastXml.DocumentElement.SelectSingleNode("/toast");

                if (criticity != "")
                {
                    toastNode.SetAttribute("duration", criticity);
                }

                XmlElement bindingNode = (XmlElement)toastXml.DocumentElement.SelectSingleNode("/toast/visual/binding");

                XmlElement imageNode = toastXml.CreateElement("image");
                imageNode.SetAttribute("src", logo);
                imageNode.SetAttribute("placement", "appLogoOverride");

                bindingNode.AppendChild(imageNode);

                XmlElement titleNode = toastXml.CreateElement("text");
                titleNode.InnerText = title;

                bindingNode.AppendChild(titleNode);

                XmlElement messageNode = toastXml.CreateElement("text");
                messageNode.InnerText = content;

                bindingNode.AppendChild(messageNode);


                if (link != "" && linkLabel != "")
                {
                    XmlElement actionsNode = (XmlElement)toastXml.DocumentElement.SelectSingleNode("/toast/actions");
                    XmlElement actionNode = toastXml.CreateElement("action");
                    actionNode.SetAttribute("activationType", "protocol");
                    actionNode.SetAttribute("content", linkLabel);
                    actionNode.SetAttribute("arguments", link);
                    actionsNode.AppendChild(actionNode);
                }

                toastXml.GetXml();
                CreateTile(title, content, logo, connexion);
                ShowToast(toastXml, deliverabletime);
            }
        }
    
        /// <summary>
        /// Affiche le toast 
        /// </summary>
        private void ShowToast(XmlDocument toastXml, DateTimeOffset dlvtime)
        {
            var toast = new ScheduledToastNotification(toastXml, dlvtime);
            var notifier = ToastNotificationManager.CreateToastNotifier();
            notifier.AddToSchedule(toast);
        }

        /// <summary>
        /// Crée la tile
        /// </summary>
        private void CreateTile(string title, string content, string logo, int connexion)
        {
            if(connexion == 1)
            {
                TileTemplate(title, content, logo);
            }
            else
            {
                TileTemplate(title, content, logo);
            }
        }
        
        /// <summary>
        /// Modèle de tile
        /// </summary>
        private void TileTemplate(string title, string content, string logo)
        {
            TileContent tileContent = new TileContent()
            {
                Visual = new TileVisual()
                {
                    Branding = TileBranding.NameAndLogo,

                    TileMedium = new TileBinding()
                    {
                        Content = new TileBindingContentAdaptive()
                        {
                            Children =
                                {
                                    new AdaptiveText()
                                    {
                                        Text = title
                                    },
                                    new AdaptiveText()
                                    {
                                        Text = content,
                                        HintStyle = AdaptiveTextStyle.Body
                                    },
                                    new AdaptiveImage()
                                    {
                                        Source = logo,
                                        HintAlign = AdaptiveImageAlign.Center
                                    }
                                }
                        }
                    },
                    TileWide = new TileBinding()
                    {
                        Content = new TileBindingContentAdaptive()
                        {
                            Children =
                                {
                                    new AdaptiveText()
                                    {
                                        Text = title
                                    },
                                    new AdaptiveText()
                                    {
                                        Text = content,
                                        HintStyle = AdaptiveTextStyle.Body
                                    },
                                    new AdaptiveImage()
                                    {
                                        Source = logo,
                                        HintAlign = AdaptiveImageAlign.Right
                                    }
                                }
                        }
                    },
                    TileLarge = new TileBinding()
                    {
                        Content = new TileBindingContentAdaptive()
                        {
                            Children =
                                {
                                    new AdaptiveText()
                                    {
                                        Text = title
                                    },
                                    new AdaptiveText()
                                    {
                                        Text = content,
                                        HintStyle = AdaptiveTextStyle.Body
                                    },
                                    new AdaptiveImage()
                                    {
                                        Source = logo
                                    }
                                }
                        }
                    }
                }
            };
            var tile = new TileNotification(tileContent.GetXml());
            TileUpdateManager.CreateTileUpdaterForApplication().Update(tile);
        }
    }
}