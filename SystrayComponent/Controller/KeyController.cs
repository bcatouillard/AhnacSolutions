using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using SystrayComponent.Classes;

namespace SystrayComponent.Controller
{
    public class KeyController
    {
        Global g = new Global();

        public void KeyListenerCallback(Keys vkCode)
        {
            switch (vkCode)
            {

                case Keys.Insert:
                    if (g.useInser)
                        this.FormShow();
                    break;
                case Keys.PrintScreen:
                    // launch ticketCreation Form
                    this.FormShow();
                    break;
                default:
                    //Console.WriteLine(vkCode);
                    break;

            }
        }

        public void FormShow()
        {
            MakeScreenShot();
            Open_HTA(Path.Combine(AppDomain.CurrentDomain.BaseDirectory +".\\Lib\\Form\\TransmetIncident.HTA"));
        }

        public void MakeScreenShot()
        {
            // createScreenShot
            using (Bitmap bmpScreenCapture = new Bitmap(SystemInformation.VirtualScreen.Width,
                                                SystemInformation.VirtualScreen.Height))
            {
                using (Graphics g = Graphics.FromImage(bmpScreenCapture))
                {
                    g.CopyFromScreen(SystemInformation.VirtualScreen.Left,
                                     SystemInformation.VirtualScreen.Top,
                                     0, 0,
                                     new Size(SystemInformation.VirtualScreen.Width, SystemInformation.VirtualScreen.Height),
                                     CopyPixelOperation.SourceCopy);
                }
                bmpScreenCapture.Save(AppDomain.CurrentDomain.BaseDirectory + "Lib\\Form\\temp\\screenshot.jpg");
            }
        }

        [DllImport("user32.dll")]
        static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")]
        static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
        const UInt32 SWP_NOSIZE = 0x0001;
        const UInt32 SWP_NOMOVE = 0x0002;
        const UInt32 SWP_SHOWWINDOW = 0x0040;

        private string Open_HTA(string sFileName_hta)
        {

            //Process.Start("IExplore.exe", "http://alertmanager.ahnac.com/glpiForm/TransmetIncident.html");

            string returnMess = "";
            if (File.Exists(sFileName_hta) == false)
            {

                return "Application not found.";
            }
            try
            {
                Process p = new Process();
                p.StartInfo.UseShellExecute = true;
                p.StartInfo.WindowStyle = ProcessWindowStyle.Normal;
                p.StartInfo.ErrorDialog = true;
                p.StartInfo.FileName = sFileName_hta;


                p.Start();
                // faire en sorte d'etre en always on top
                SetForegroundWindow(p.MainWindowHandle);
                SetWindowPos(p.MainWindowHandle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
                SetParent(p.MainWindowHandle, Process.GetCurrentProcess().MainWindowHandle);

                p.Dispose();
                returnMess = sFileName_hta;
            }
            catch (Win32Exception ex)
            {
                returnMess = ex.Message;
            }
            return returnMess;
        }
    }
}
