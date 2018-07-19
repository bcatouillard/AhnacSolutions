// Constants and Var
var glpiURL = "http://ahnwkf:8080/glpi/plugins/webservices/rest.php";

var userGLPI = "glpi";
var pwdGLPI = "glpi";


var sessionId = '';
var ticketType = { id: '', name: '' };
var mainCat = { id: '', name: '' };
var subCat = { id: '', name: '' };

var ticketTypeList = [];

var mainCatList = [];
var subCatList = [];

var currentStep = 0;



var screenShotPath = './temp/screenshot.jpg';

var user = {
    glpiId: "",
    glpiLogin: "",
    ssoLogin: "",
    winLogin: "",
    lastName: "",
    firstName: "",
    locationName: "",
    locationId: "",
    userPhone: "",
    userEmail: ""
};

var ticket = {
    type: { id: "", name: "" },
    mainCat: {id:"",name:""},
    subCat: { id: "", name: "" },
    title: "",
    content: ""

}

var $progressBar = null;

$(document).ready(function () {

    setTimeout(function () { window.focus() }, 100); // pour mettre au premier plan la fenetre
   

    $(window).unload(function () {
        logout();
    });
    window.resizeTo(1200, 650);
    // init progressBar
    initProgressBar();

    // connexion GLPI
  
    $('#first a').tab('show');

    getIPAddress();
    glpiLogin(function (data) {
        // TODO : prevoir un soucis de session

        if (typeof data.faultCode == 'undefined') {
            sessionId = data.session;
            
            getTicketsData(function () {initIncidentForm(); });


        } else {
            displayError(data);
        }

    }, function (errorData) {
        displayError(errorData);
    });



    $('.btn-reinit').click(function () {
        location.reload();
    });





});



function getTicketsData(callback) {

    // recup des types


    getTicketType(function (ticketData) {
        $.each(ticketData, function (key, value) {



            // add cat and SubCat array
            value.mainCatList = [];

            var subCatList = [];

            ticketTypeList[value.id] = value;

            // retrieve associated cat

            getTicketCat(value.id, function (catData) {

                $.each(catData, function (catKey, catValue) {

                    if (catValue.itilcategories_id == 0) {

                        // cat principale
                        value.mainCatList[catValue.id] = catValue;
                        value.mainCatList[catValue.id].subCatList = [];
                    }
                    else {
                        // sous cat
                        subCatList.push(catValue);
                    }


                });// each catData



                $.each(subCatList, function (subCatKey, subCatValue) {

                    value.mainCatList[subCatValue.itilcategories_id].subCatList[subCatValue.id] = subCatValue



                }); //.each(subCatList


                // Init done
               
               

            }); // getTicketCat


        }); // each ticketData

        callback();


    }); // getTicketType



}

function goToStep(step) {
        
    
    var goToNext = true;
    if (step == "next")
    {
        currentStep++;
       
    }else if(step == "prev")
    {
        if (currentStep>0)
            currentStep--;
    }else{
        $('#formCarousel').carousel(step);

    }

    if (currentStep >= 5)
    {
        if ($('#description').val() != "") {
            createTicket();
        } else {
           
            $(".descGroup").addClass("has-error has-feedback");
            $(".descGroup").effect("shake", { times: 2, direction: 'left' }, "slow");
            return;
        }
    }

   
        $('#formCarousel').carousel(currentStep);

        $progressBar.setCurrentStep(currentStep);
   
  


}

function initIncidentForm() {

    $('.loader').hide();

    
    

    displayButtonList(".ticketType", ticketTypeList, "bigButton", function (curTypeButton) {
        //do something with button
        $('.ticketType button').removeClass('active');
        $(curTypeButton).addClass("active");



        ticket.type.id = $(curTypeButton).attr('value');
        ticket.type.name = $(curTypeButton).text();


        displayButtonList(".mainCat", ticketTypeList[ticket.type.id].mainCatList, "bigButton", function (curMainCatButton) {
            //do something with button

            $('.mainCat button').removeClass('active');
            $(curMainCatButton).addClass("active");

            ticket.mainCat.id = $(curMainCatButton).attr('value');
            ticket.mainCat.name = $(curMainCatButton).text();
           


            displayButtonList(".subCat", ticketTypeList[ticket.type.id].mainCatList[ticket.mainCat.id].subCatList, "btn-lg col-md-3", function (curSubCatButton) {
                //do something with button
                $('.subCat button').removeClass('active');
                $(curSubCatButton).addClass("active");

                ticket.subCat.id = $(curSubCatButton).attr('value');
                ticket.subCat.name = $(curSubCatButton).text();
               

                goToStep("next");
            });
            
            goToStep("next");
        });
        goToStep("next");
    });




    getUserInfo(function (userInfoData) {

        if(typeof(userInfoData)!="undefined")
        {
            user.glpiId = userInfoData.id;
            user.lastName = userInfoData.realname;
            user.firstName = userInfoData.firstname;
            user.locationId = userInfoData.locations_id;
            user.locationName = userInfoData.locations_name;
            user.userPhone = userInfoData.phone;
            user.userMail = userInfoData.email;

            $('.templates .userForm').appendTo($('.step4'));

            $('#lastName').val(user.lastName);
            $('#firstName').val(user.firstName);
            $('#phone').val(user.userPhone);
            $('#mail').val(user.userMail);

            // on desactive location 
            /*
            getLocation(function(allLocation){
                
                // generation de la liste des etablissements
                
                $('<option>').attr("value",0).text("").appendTo($('#location'));
                $(allLocation).each(function(){
                    $('<option>').attr("value",this.id).text(this.name).appendTo($('#location'));
                                
                });
                
                // selection de l'etablissement du user
                $('#location').val(user.locationId);
                
            });
            */

        }
       


    });

    $('.next-step').click(function () {
        goToStep("next");
    })



  
}




function displayButtonList(target, data, type, onclickFct) {
    if (data.length > 0) {

        $(target).empty();

        var btnTemplate = $('.templates .btnTmp').clone();
        $.each(data, function (key, value) {
            if (value != null) {

                var btnTmp = btnTemplate.clone();
                btnTmp.addClass(type);
                btnTmp.html(value.name);
                btnTmp.attr("value", value.id);
                btnTmp.attr("arrayIndex", key);

                btnTmp.click(function () { onclickFct(this) });

                btnTmp.appendTo(target);
            }
        })
    }
}






function displayError(data) {
    $('.error').removeClass('hidden');
    $('.error').show();
    $('.carousel').hide();
}


// ---------------------------------- //





function logout() {
    $.ajax({
        url: glpiURL,
        data: {
            method: 'glpi.doLogout',
            session: sessionId
        }
    });

}

function getTicket(ticketId) {
    var ticketData = {
        method: "glpi.getTicket",
        ticket: ticketId,
        session: sessionId
    }

    $.ajax({
        url: glpiURL,
        data: ticketData
    }).done(function (data) {
        $('.mainform').append(JSON.stringify(ticketData) + "<hr/>" + JSON.stringify(data));

    });
}



function createTicket() {


    createContentString();

    var ticketData = {
        method: "glpi.createTicket",
        user: user.glpiId,
        type: ticket.type.id,
        title: ticket.title,
        content: ticket.content,
        category: ticket.subCat.id,
        user_email: user.email,
        locations_id: user.locationId,
        locations: user.locationId,
        location: user.locationId,
        session: sessionId
    }

    
  
    $.ajax({
        url: glpiURL,
        data: ticketData
    }).done(function (data) {

        // get the ticket ID
        var responseData = JSON.parse(data);
        var ticketId = responseData.id;
       // alert(JSON.stringify(responseData));
        

        // envoi capture si besoin
        if ($('#includeScreen').is(':checked')) {
            // add screenShot
            addScreenToTicket(ticketId, screenShotPath, function () {
                 window.close();
                
            });

        } else {
            window.close();
        }

        



    });


}


function addLocationToTicket(ticketId, locationId, callback) {
    //ticket_tco
    // TO DO ! 

    callback();
    /*
        var ticketData = {method:"glpi.updateObjects",
            fields:[{ticket_tco :[{id:ticketId,locations_id:locationId}]}
            ],
            session:sessionId
            }	;	
            
        $.ajax({
            url: glpiURL,
            data: ticketData
            }).done(function(data) {
            
                callback(data);
            });
            */


}

function createContentString() {

    var ipp = $('#ipp').val();

    var lastNameForm = $('#lastName').val();
    var firstNameForm = $('#firstName').val();
    var phoneForm = $('#phone').val();
    var mailForm = $('#mail').val();


    var contentText = "\n";
    contentText += "Demandeur : " + ((lastNameForm) ? lastNameForm : user.lastName) + " " + ((firstNameForm) ? firstNameForm : user.firstName) + " - tel : " + ((phoneForm) ? phoneForm : user.userPhone) + "\n";
    contentText += "Login Windows : " + user.winLogin + " - Login SSO : " + user.ssoLogin + " - Etablissement : " + user.locationName + "\n";
    contentText += "Nom PC : " + getComputername() + " - Adresse IP : " + getIPAddress() + "\n";
    contentText += "____________________________________________________\n";
    if (ipp != "")
        contentText += "IPP/IEP : " + ipp + "\n";

    contentText += $('#description').val();
    var titleText = "[" + ticket.type.name + "][" + ticket.mainCat.name + "][" + ticket.subCat.name + "]" + user.glpiLogin;

    if ($('#titre').val() != "") titleText = $('#titre').val();

    ticket.content = contentText;
    ticket.title = titleText;

   // return { content: contentText, title: titleText };
}

function initProgressBar() {

    $progressBar = $("#progressBar").progressStep({ margin: 0 });
    $progressBar.setClickEnabled(true);

   

    $progressBar.addStep("mainCat");

   
    $progressBar.addStep();
    $progressBar.addStep();
    $progressBar.addStep();
    $progressBar.addStep();

    var step = $progressBar.getStep(1);
    step.onClick(function () {

        alert($progressBar.getCurrentStep());

    });

    $progressBar.refreshLayout();
    $progressBar.setCurrentStep(0);

}



function validateUserForm() {
    var isValid = true;
    $('.userForm .form-group').each(function () {

        if ($(this).find('.mandatory').val() == "") {
            $(this).append($('<span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>'));
            $(this).addClass("has-error has-feedback");
            $(this).effect("shake", { times: 2, direction: 'left' }, "slow");
            isValid = false;
        }
        else {
            $(this).find('.form-control-feedback').remove();
            $(this).removeClass("has-error has-feedback");
        }

    });

    return isValid;
}


function glpiLogin(callback, errorCallback) {

    var ticketData = { method: "glpi.doLogin", login_name: 'glpi', login_password: 'glpi' };


    $.ajax({
        type: 'get',
        url: glpiURL,
        data: ticketData,
    }).error(function (data) {
        
        errorCallback(data);

    }).done(function (data) {
        
        var jsonData = JSON.parse(data);

        callback(jsonData);

    });
}


function getTicketType(callback) {
    //sessionId		


    $.ajax({
        url: "http://ahnwkf:8080/glpi/plugins/webservices/rest.php",
        data: { method: "glpi.listDropdownValues", dropdown: "tickettype", session: sessionId }
    }).done(function (data) {
        callback(JSON.parse(data));


    });

}

function getLocation(callback) {

    $.ajax({
        url: "http://ahnwkf:8080/glpi/plugins/webservices/rest.php",
        data: { method: "glpi.listDropdownValues", dropdown: "Location", session: sessionId }
    }).done(function (data) {

        callback(JSON.parse(data));


    });

}


function getTicketCat(ticketType, callback) {

    var typeName = "";

    switch (ticketType) {
        case 1: // incident
            typeName = "is_incident";
            break;
        case 2: // demande
            typeName = "is_request";
            break;
    }


    $.ajax({
        url: "http://ahnwkf:8080/glpi/plugins/webservices/rest.php",
        data: { method: "glpi.listDropdownValues", dropdown: "ITILCategory", criteria: typeName, limit: 1000, session: sessionId }
    }).done(function (data) {

        callback(JSON.parse(data));


    });

}

function getSSOName() {
    var loginSSo = "";
    try {
        oFso = new ActiveXObject("SSO_CPX_Agentl.SimpleObject");
        loginSSo = oFso.GetLoginCarteInseree();

    } catch (err) {
        // do nothing
    };

    return loginSSo;
}

function getWinUsername() {
    var objUserInfo = new ActiveXObject("WScript.network");

    return objUserInfo.UserName;
}

function getComputername() {
    var objUserInfo = new ActiveXObject("WScript.network");

    return objUserInfo.ComputerName;


}

function getIPAddress() {
    var oShell = new ActiveXObject("WScript.Shell");
    var test = oShell.exec('cmd /C (for /f "tokens=1,* delims=:" %a in (' + "'ipconfig ^| FIND " + '"Adresse IPv4"' + "') do @echo %b)");
    var IPAddress = test.StdOut.ReadAll().replace('\r', '');

    return IPAddress;
}


function getUserInfo(callback) {
    user.ssoLogin = getSSOName();
    user.winLogin = getWinUsername();


    if (user.winLogin != "")
        user.glpiLogin = user.winLogin;
    if (user.ssoLogin != "")
        user.glpiLogin = user.ssoLogin;

    $("#glpiLogin").attr("value", user.glpiLogin);


    $.ajax({
        url: "http://ahnwkf:8080/glpi/plugins/webservices/rest.php",
        data: { method: "glpi.listUsers", login: user.glpiLogin, session: sessionId }
    }).done(function (data) {

        var userInfoData = JSON.parse(data)[0];

        callback(userInfoData);


    });

}

function addScreenToTicket(ticketId, filePath, callback) {

    var base64File = encodeLocalFile(filePath);
    
    if (base64File != false) {
        $.xmlrpc({
            url: "http://ahnwkf:8080/glpi/plugins/webservices/xmlrpc.php",
            methodName: 'glpi.addTicketDocument',
            params: [{
                ticket: ticketId,
                name: "capture2.jpg",
                base64: base64File,
                session: sessionId
            }],
            success: function (response, status, jqXHR) {
               
                callback(response);

            },
            error: function (jqXHR, status, error) {
              
                callback(error);
            },
            done: function (reponse, status) {
                alert(response);

            }
        });
    } else {
                
        callback("");
    }





}

function encodeLocalFile(path) {
    var objXMLDoc = new ActiveXObject("MSXML2.DOMDocument");
    var objXMLDocElem = objXMLDoc.createElement("root");

    var objADOStrm = new ActiveXObject("ADODB.Stream");

    var fso = new ActiveXObject("Scripting.FileSystemObject");

    var myData = false;
    if (fso.FileExists(path) == true) {
        objADOStrm.Type = 1;
        objADOStrm.Open();
        objADOStrm.LoadFromFile(path);

        objXMLDocElem.dataType = "bin.base64"
        objXMLDocElem.nodeTypedValue = objADOStrm.Read();

        myData = objXMLDocElem.text;

        objADOStrm.Close();

    }

    return myData;

}




