// Constants and Var
var glpiURL = "http://ahnwkf:8080/glpi/plugins/webservices/rest.php";

var userGLPI = "glpi";
var pwdGLPI = "glpi";


var sessionId = '';
var ticketType = { id: '', name: '' };
var mainCat = { id: '', name: '' };
var subCat = { id: '', name: '' };

var mainCatList = [];
var subCatList = [];

var ticketCreated = false;
var locationUpdated = false;
var screenAdded = false;




var screenShotPath = 'c:/ScriptsDosi/HC001.jpg';

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

var $progressBar = null;

$(document).ready(function () {

    $progressBar = $("#progressBar").progressStep({ margin: 0 });

    $(window).unload(function () {
        return "Bye now!";
        logout();
    });


    window.resizeTo(1200, 650);


    // init progressBar

    initProgressBar();

    //getTicket(17351);

    // connexion GLPI

    getIPAddress();
    glpiLogin(function (data) {
        // TODO : prevoir un soucis de session

        if (typeof data.faultCode == 'undefined') {
            sessionId = data.session;
            displayStep(1);
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


function displayError(data) {
    $('.error').appendTo($(".mainform"));
}



function displayStep(stepNbr) {

    $("<div></div>").addClass('step row step' + stepNbr).appendTo($(".mainform"));

    $progressBar.setCurrentStep(stepNbr - 1);
    $('.step').hide();
    $('.step' + stepNbr).show();

    window["createStep" + stepNbr]();

}




function displayButtonList(target, data, type, onclickFct) {
    if (data.length > 0) {
        var btnTemplate = $('.templates .btnTmp').clone();
        $.each(data, function (key, value) {

            var btnTmp = btnTemplate.clone();
            btnTmp.addClass(type);
            btnTmp.html(value.name);
            btnTmp.attr("value", value.id);

            btnTmp.click(function () { onclickFct(this) });

            btnTmp.appendTo(target);
        })
    }
}

// incident ou Demande
function createStep1() {
    getTicketType(function (data) {

        displayButtonList(".step1", data, "bigButton", function (curButton) {

            $('.step1 button').removeClass('active');
            $(curButton).addClass("active");


            ticketType.id = $(curButton).attr('value');
            ticketType.name = $(curButton).text();
            displayStep(2);



        });



    });


}

// categorie principale

function createStep2() {
    var ticketType = $("#ticketType").attr("value");

    getTicketCat(ticketType, function (data) {

        $.each(data, function (key, value) {

            if (value.itilcategories_id == 0) {

                // cat principale
                mainCatList.push(value);
            }
            else {
                // sous cat
                subCatList.push(value);
            }


        });


        displayButtonList(".step2", mainCatList, "bigButton", function (curButton) {

            $('.step2 button').removeClass('active');
            $(curButton).addClass("active");

            mainCat.id = $(curButton).attr('value');
            mainCat.name = $(curButton).text();
            displayStep(3);

        });



        //alert(JSON.stringify(data));
    });


}

// sous categorie

function createStep3() {
    var ticketType = $("#ticketType").attr("value");

    var activeSubCat = [];

    $.each(subCatList, function (key, value) {

        if (value.itilcategories_id == mainCat.id) {

            // cat principale
            activeSubCat.push(value);
        }
    });

    displayButtonList(".step3", activeSubCat, "bigButton", function (curButton) {

        $('.step3 button').removeClass('active');
        $(curButton).addClass("active");


        subCat.id = $(curButton).attr('value');
        subCat.name = $(curButton).text();
        displayStep(4);

    });

}

// utilisateur

function createStep4() {

    getUserInfo(function (userInfoData) {

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


    });

    $('.userForm button').click(function () {
        if (validateUserForm()) {

            displayStep(5);

        }

    });

}

// description du pb

function createStep5() {

    $('.templates .descForm').appendTo($('.step5'));

    $('.descForm button').click(function () {
        if ($('#description').val() != "") {
            displayStep(6);
        } else {
            $(".descGroup").append($('<span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>'));
            $(".descGroup").addClass("has-error has-feedback");
            $(".descGroup").effect("shake", { times: 2, direction: 'left' }, "slow");

        }


    });

}

// résumé de la demande
function createStep6() {

    // on skippe pour le moment, et on envoie

    $('.loader').appendTo($('.mainform'));
    createTicket();



}


function isItTheEnd() {

    if (ticketCreated && screenAdded) {

        window.close();

    }

}

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

    var ticketBody = createContentString();

    var ticketData = {
        method: "glpi.createTicket",
        user: user.glpiId,
        type: ticketType.id,
        title: ticketBody.title,
        content: ticketBody.content,
        category: subCat.id,
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

        ticketCreated = true

        // envoi capture si besoin
        if ($('#includeScreen').is(':checked')) {
            // add screenShot
            addScreenToTicket(ticketId, screenShotPath, function () {

                isItTheEnd()
            });

        } else {
            screenAdded = true;
        }

        isItTheEnd();



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
    var titleText = "[" + ticketType.name + "][" + mainCat.name + "][" + subCat.name + "]" + user.glpiLogin;

    if ($('#titre').val() != "") titleText = $('#titre').val();



    return { content: contentText, title: titleText };
}

function initProgressBar() {


    $progressBar.addStep();
    $progressBar.addStep();
    $progressBar.addStep();
    $progressBar.addStep();
    $progressBar.addStep();

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
        //alert(glpiURL + " \n" +JSON.stringify(ticketData) + "\n response : " + data);

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
                screenAdded = true;
                callback(response);

            },
            error: function (jqXHR, status, error) {
                screenAdded = true;
                callback(error);
            }
        });
    } else {
        screenAdded = true;
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




