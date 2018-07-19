using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace ClassLibrary.Classes
{
    [DataContract]
    public class Alert
    {
        [DataMember]
        public int Id { get; set; }
        [DataMember]
        public string Status { get; set; }
        [DataMember]
        public DateTime StartDate { get; set; }
        [DataMember]
        public DateTime EndDate { get; set; }
        [DataMember]
        public string Criticity { get; set; }
        [DataMember]
        public int Frequence { get; set; }
        [DataMember]
        public string Title { get; set; }
        [DataMember]
        public string Message { get; set; }
        [DataMember]
        public string Image { get; set; }
        [DataMember]
        public List<string> AdGroups { get; set; }
        [DataMember]
        public List<string> PcFilter { get; set; }

        public Alert(int Id, string Status, DateTime StartDate, DateTime EndDate, string Criticity,
            int Frequence, string Title, string Message, string Image, List<string> AdGroups, List<string> PcFilter)
        {
            this.Id = Id;
            this.Status = Status;
            this.StartDate = StartDate;
            this.EndDate = EndDate;
            this.Criticity = Criticity;
            this.Frequence = Frequence;
            this.Title = Title;
            this.Message = Message;
            this.Image = Image;
            this.AdGroups = AdGroups;
            this.PcFilter = PcFilter;
        }
    }

    static class Global
    {
        public const string criticityNormal = "normal";
        public const string criticityLow = "low";
        public const string criticityHigh = "high";
    }
}
