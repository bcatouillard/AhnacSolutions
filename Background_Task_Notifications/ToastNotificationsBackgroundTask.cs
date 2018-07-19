using ClassLibrary.Methods;
using Windows.ApplicationModel.Background;

namespace Background_Task_Notifications
{
    public sealed class ToastNotificationsBackgroundTask : IBackgroundTask
    {
        public void Run(IBackgroundTaskInstance taskInstance)
        {
            // Get a deferral since we're executing async code
            var deferral = taskInstance.GetDeferral();
            try
            {
                Data dt = new Data();
                dt.LoadJson();
            }
            finally
            {
                deferral.Complete();
            }
        }
    }
}
