var connect = require("connect");
var logger = require("morgan");
var serve_static = require("serve-static");
var http = require("http");
var url = require('url');
var ejs = require('ejs');
var bodyparse = require('body-parser');
var cookieparser = require('cookie-parser');
var ex_session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);
var url = 'mongodb://localhost:27017/persCont';
var results = [];
var newID;
var contactList;
var newAddress;
var firstname;
var lastname;
var abbr;
var email;
var phone;
var methods;
var addr;
var city;
var zip;
var location;
var i = 0;
MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server.");

  contactList = db.collection('contacts');
  var app = connect()
    .use (logger('dev'))
    .use (cookieparser())
    .use (bodyparse())
    .use (serve_static('public'))
    .use (serve);
  http.createServer(app).listen(3000);
});
var newContact;
function serve (req, res) {
    console.log(req.url);
    if ( req.url == "/contact") {
        console.log("Starting!");
        render (res, "contact", {});
    }
    else if ( req.url == "/mailer") {
      abbr = req.body.abb;
      firstname = req.body.fname;
      lastname = req.body.lname;
      addr = req.body.address;
      city = req.body.city;
      location = req.body.loc;
      zip = req.body.ZipCode;
      phone = req.body.Phone;
      email = req.body.Email;
      methods = req.body.cmethod;
      newAddress = req.body.address + ', ' + req.body.city + ', ' + req.body.loc + ', ' + req.body.ZipCode;
      geocoder.geocode(newAddress, function(err, data) {
        if (!err) {
          console.log(data);
          newContact = {
            Name : req.body.abb + " " + req.body.fname + " " + req.body.lname,
            Address : newAddress,
            Phone : req.body.Phone,
            Email : req.body.Email,
            Methods : req.body.cmethod,
            _id: i + 1
          }
          contactList.insert(newContact);
          i++;
          render(res, "mailer", {cinfo: newContact});
        }
        else {
          console.log(err);
        }
      });
    }
    else if (req.url == "/contacts") {
      contactList.find().toArray(function(err, result){
        if (err) {
          console.log(err);
        }
        else if (result.length) {
          for (var i = 0; i < result.length; i++) {
            console.log(JSON.stringify(result[i]));
            results.push(result[i]);
          }
        }
        else {
          console.log("No documents found");
        }
      render(res, "contacts", {cinfo: result});
      });
    }
    else if (req.url.substring(0, 7) == "/update") {
      newID = req.url.substring(16);
      console.log(newID);
      console.log("Attempting update");
      render(res, "update", {
        fname: results[newID-1].Name,
        lname: results[newID-1].Name,
        address: results[newID-1].Address,
        city: results[newID-1].Address,
        state: results[newID-1].Address,
        zip: results[newID-1].Address.substring(results[newID-1].Address.length - 5),
        phone: results[newID-1].Phone,
        email: results[newID-1].Email,
        _id: results[newID-1]._id
      });
    }
    else if (req.url == "/new") {
      newAddress = req.body.address + ', ' + req.body.city + ', ' + req.body.loc + ', ' + req.body.ZipCode;
      geocoder.geocode(newAddress, function(err, data) {
        if (!err) {
          console.log(data);
          var updatedContact = {
            Name : req.body.abb + " " + req.body.fname + " " + req.body.lname,
            Address : newAddress,
            Phone : req.body.Phone,
            Email : req.body.Email,
            Methods : req.body.cmethod,
            _id : parseInt(newID)
          }
          console.log(updatedContact._id);
          contactList.update({_id : updatedContact._id}, updatedContact, {upsert: true});
          contactList.find().toArray(function(err, result){
            if (err) {
              console.log(err);
            }
            else if (result.length) {
              for (var i = 0; i < result.length; i++) {
                console.log(JSON.stringify(result[i]));
              }
            }
            else {
              console.log("No documents found");
            }
          });
          render(res, "new", {cinfo: updatedContact});
        }
        else {
          console.log(err);
        }
      });
    }
    else if (req.url == "/done") {
      i = 0;
      contactList.remove({});
      render(res, "done", {});
    }
    else if (req.url.substring(0, 7) == "/delete") {
      newID = parseInt(req.url.substring(16));
      console.log(newID);
      console.log("Deleting contact from database");
      contactList.remove({_id : newID});
      render(res, "delete", {})
    }
    else {
        res.end("Page not found!");
    }
}

function render (res, view, model) {
     ejs.renderFile("templates/" + view + ".ejs" ,model,
        function(err, result) {
            if (!err) {
                res.end(result);
            }
            else {
                res.end("An error occurred");
            }
        }
    );
}
