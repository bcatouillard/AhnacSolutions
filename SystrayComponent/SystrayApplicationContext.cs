using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;
using SystrayComponent.Classes;
using SystrayComponent.Controller;
using Windows.ApplicationModel;
using Windows.ApplicationModel.AppService;
using Windows.ApplicationModel.Core;
using Windows.Foundation.Collections;

namespace SystrayComponent
{
    public class SystrayApplicationContext : ApplicationContext
    {
        public AppServiceConnection connection = null;
        public NotifyIcon notifyIcon = null;
        Global g = new Global();
        Methods m = new Methods();

        public SystrayApplicationContext()
        {
            new InterceptKeys().StartListener();
            MenuItem version = new MenuItem("Version : " + Application.ProductVersion)
            {
                Enabled = false
            };

            MenuItem openMenuItem = new MenuItem("Ouvrir l'application", new EventHandler(m.OpenApp));

            MenuItem incident = new MenuItem("Déclarer un incident", new EventHandler(m.Incident));

            MenuItem useInsert = new MenuItem("Utiliser Insert", new EventHandler(m.UseIns))
            {
                Checked = g.useInser
            };

            MenuItem exitMenuItem = new MenuItem("Quitter", new EventHandler(m.Exit));

            openMenuItem.DefaultItem = true;

            notifyIcon = new NotifyIcon
            {
                Text = "Ahnac Notifications"
            };
            notifyIcon.DoubleClick += new EventHandler(m.OpenApp);
            notifyIcon.Icon = Properties.Resources.logo_ahnac_blanc_ZEU_icon;
            notifyIcon.ContextMenu = new ContextMenu(new MenuItem[] { version, openMenuItem, incident, useInsert, exitMenuItem });
            notifyIcon.Visible = true;
        }


        public class Methods
        {
            Global g = new Global();

            public async void OpenApp(object sender, EventArgs e)
            {
                IEnumerable<AppListEntry> appListEntries = await Package.Current.GetAppListEntriesAsync();
                await appListEntries.First().LaunchAsync();
            }

            public void Incident(object sender, EventArgs e)
            {
                KeyController kc = new KeyController();
                kc.FormShow();
            }

            public void UseIns(object sender, EventArgs e)
            {
                g.useInser = !g.useInser;
            }

            public void Exit(object sender, EventArgs e)
            {
                ValueSet message = new ValueSet
            {
                { "Quitter", "" }
            };
                Application.Exit();
            }

            public void Connection_ServiceClosed(AppServiceConnection sender, AppServiceClosedEventArgs args)
            {
                SystrayApplicationContext s = new SystrayApplicationContext();
                s.connection.ServiceClosed -= Connection_ServiceClosed;
                s.connection = null;
            }
        }
    }
}