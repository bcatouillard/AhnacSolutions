using Background_Task_Notifications;
using System;
using System.Linq;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Background;
using Windows.Foundation;
using Windows.Foundation.Metadata;
using Windows.UI.Core.Preview;
using Windows.UI.StartScreen;
using Windows.UI.Xaml.Controls;

// Pour plus d'informations sur le modèle d'élément Page vierge, consultez la page https://go.microsoft.com/fwlink/?LinkId=234238

namespace AhnacSolutions
{
    /// <summary>
    /// Une page vide peut être utilisée seule ou constituer une page de destination au sein d'un frame.
    /// </summary>
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
            Register();
            Pin();
            SystemNavigationManagerPreview mgr =
                SystemNavigationManagerPreview.GetForCurrentView();
            mgr.CloseRequested += SystemNavigationManager_CloseRequested;
        }

        private void Register()
        {
            var builder = new BackgroundTaskBuilder();
            var taskRegistered = false;
            var TaskName = "ToastNotificationsBackgroundTask";

            foreach (var task in BackgroundTaskRegistration.AllTasks)
            {
                if (task.Value.Name == TaskName)
                {
                    taskRegistered = true;
                    break;
                }
            }

            if (taskRegistered != true)
            {
                builder.Name = TaskName;
                builder.TaskEntryPoint = "Background_Task_Notifications.ToastNotificationsBackgroundTask";
                builder.SetTrigger(new SystemTrigger(SystemTriggerType.UserPresent, false));

                BackgroundTaskRegistration btask = builder.Register();
            }

            //foreach (var t in BackgroundTaskRegistration.AllTasks)
            //{
            //    t.Value.Unregister(false);
            //}
        }

        private async void SystemNavigationManager_CloseRequested(object sender, SystemNavigationCloseRequestedPreviewEventArgs e)
        {
            Deferral deferral = e.GetDeferral();
            ConfirmCloseDialog dlg = new ConfirmCloseDialog();
            ContentDialogResult result = await dlg.ShowAsync();
            if (result == ContentDialogResult.Secondary)
            {
                // user cancelled the close operation
                e.Handled = true;
                deferral.Complete();
            }
            else
            {
                switch (dlg.Result)
                {
                    case CloseAction.Terminate:
                        e.Handled = false;
                        deferral.Complete();
                        break;

                    case CloseAction.Systray:
                        if (ApiInformation.IsApiContractPresent(
                             "Windows.ApplicationModel.FullTrustAppContract", 1, 0))
                        {
                             await FullTrustProcessLauncher.LaunchFullTrustProcessForCurrentAppAsync();
                        }
                        e.Handled = false;
                        deferral.Complete();
                        break;
                }
            }
        }

        public async void Pin()
        {
            if (ApiInformation.IsTypePresent("Windows.UI.StartScreen.StartScreenManager"))
            {
                StartupTask startupTask = await StartupTask.GetAsync("AhnacSolutions");
                var entry = (await Package.Current.GetAppListEntriesAsync())[0];

                var startScreenManager = StartScreenManager.GetDefault();

                bool supportsPin = startScreenManager.SupportsAppListEntry(entry);

                if (supportsPin)
                {
                    var appListEntry = (await Package.Current.GetAppListEntriesAsync())[0];
                    bool didPin = await StartScreenManager.GetDefault().RequestAddAppListEntryAsync(appListEntry);

                }
            }
        }

    }
}