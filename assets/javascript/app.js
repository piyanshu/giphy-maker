//Databasing
var config = {
    apiKey: "AIzaSyDju-ufXCy5nHMPUefNuZu6EjGC5kdLd9I",
    authDomain: "authentication-43ba6.firebaseapp.com",
    databaseURL: "https://authentication-43ba6.firebaseio.com",
    storageBucket: "authentication-43ba6.appspot.com"
};
firebase.initializeApp(config); //starting database (jtsai)
//a couple of database variables that will be referenced (jtsai)
const database = firebase.database();
const dbAuth = database.ref('/authentication');

var topics = ["puppies", "kitties", "baby bunnies", "ducklings", "puppy", "kitty", "bunnies", "hamster", "cats", "dogs", "corgis", "red pandas", "quokka", "cute", "cute animals", "baby animals", "adorable animals"];
//
var str, imgStill, imgAnimate, imgId;

var favCookie, favImg, favArray = [];

//API variables

// ToDo: Properly name and set these up, these are placeholders

var queryValue = "",
    queryRequest = "",
    queryTitle; 
//May make these adjustable variables
var queryLimit = 10
var queryRating = "G";
var queryOffset = 0;

//This needs to go after the terms in it
var queryURL = 
    "https://api.giphy.com/v1/gifs/search?" +
    "&limit=" + queryLimit + 
    "&rating=" + queryRating + 
    "&offset="; //need to add offset and query default ending

//generating topics at the start
for(let i = 0; i < topics.length; i++) {
    buttonGen(topics[i]);
}

for(let i = 0; i < localStorage.length; i++) {
    //console.log(localStorage.key(i));
    var img = JSON.parse(localStorage[localStorage.key(i)]);
    favorite(img);
}

$(".fav").hide();

//Do this after page loads
$(document).ready(function () {
    $("nav button").on("click", function(){
        var clickId = $(this).attr("id");
        var slideSpeed = 400;

        if(clickId === "nav-images"){
            console.log("nav-images clicked");
            $("button.img").show();
            $("section.img").slideDown(slideSpeed);
            $("section.fav").slideUp(slideSpeed);
            $("button.fav").hide();
        } else {
            console.log("nav-favorites clicked");
            $("button.fav").show();
            $("section.fav").slideDown(slideSpeed);
            $("section.img").slideUp(slideSpeed);
            $("button.img").hide();
        }
    });

    $("#search form button").on("click", function(){
        event.preventDefault();
        console.log("submitted");
        
        var queryNew = $("input").val();
        console.log(queryNew);

        buttonGen(queryNew);

        $('#search form').trigger("reset");
    });

    $("#search button").on("click", function(){
        event.preventDefault();
        var clicked = $(this).attr("id");
        
        if(clicked === "clearBtn") {
            $("#buttons .container").empty();
        } 
        if(clicked === "clearImg") {
            $("#images .container").empty();
        }
        if(clicked === "clearFav") {
            $("#favorites .container").empty();
        }
        if(clicked === "clearHist") {
            localStorage.clear();
        }
        
    });


    $("#buttons").on("click", ".container button", function() {
        var queryValue = $(this).attr("data-query");
        var queryOffset = $(this).attr("data-offset");

        //console.log(`Topic: ${queryValue}, Offset: ${queryOffset}`);

        var queryRequest = queryURL + queryOffset +
        "&lang=en&q=" + queryValue;
        //console.log(queryRequest);
        
        //Call queryAPI
        queryAPI(queryRequest);

        //Offset the images by 10 every time this button is clicked
        $(this).attr("data-offset", (parseInt(queryOffset) + 10));
        //console.log(queryOffset);
    });

    $(".container").on("click", "figure", function() {
        console.log("image click");

        var img = $(this).find("img");
        //console.log(img);

        toggleAnimation(img);
    })

    // Image Mouseover
    $("main").on("mouseenter", "figure", function() {
        //console.log("mouse enter");
        var img = $(this).find("img");

        img.attr({
            "src": img.attr("data-animate"), 
            "data-state": "animate"
        });
    })

    // Image Mouseout
    $("main").on("mouseleave", "figure", function() {
        //console.log("mouse leave");
        var img = $(this).find("img");

        img.attr({
            "src": img.attr("data-still"), 
            "data-state": "still"
        });
    })

    $("#images").on("click", ".favBtn", function() {
        var imgFav = $(this).parent().find("img");
        console.log(imgFav);

        //https://media0.giphy.com/media/ONuQzM11fjvoY/200_s.gif?cid=caf2745ff0bd14813ce3a646a9feb8dd7b2343472f3c54c2&rid=200_s.gif
        //shortening url for local storage
        var newFav = urlCutter(imgFav);
        //console.log(newFav);

        favorite(newFav);
    });

    //removing favorite
    $("#favorites").on("click", ".favBtn", function() {
        var unFav = $(this).parent();
        console.log(unFav);
        unFav.remove();
        
        var unFavId = unFav.find("img").attr("id");
        console.log("UnFavId: " + unFavId);
        
        localStorage.removeItem(unFavId);
    });
});

// ? Welcome to functions

function buttonGen(str) {
    var btnContainer = $("#buttons .container")
    var newButton = $("<button>")
        .text(str)
        .attr({
            "data-query" : (str.replace(/\s/g,'/')),
            "data-offset" : 0
        });

    btnContainer.prepend(newButton);
}

function imageGen() {
    var figure = $("<figure>").append(
        $("<button class='favBtn'>").append(
            "<i class='fas fa-star'>",
            "<i class='far fa-star'>"
        ),
        $("<img>").attr({
            "id" : imgId,
            "alt" : queryTitle,
            "src" : imgStill,
            "data-state" : "still",
            "data-still" : imgStill,
            "data-animate" : imgAnimate,
            "data-rating" : queryRating
        }),
        $("<figcaption>").append(
            $("<p class='title'>").text(queryTitle),
            $("<p>").text(`${queryRating}-rated content`)

        )
    );

    $("#images .container").prepend(figure);
}

function queryAPI(queryURL) {
    dbAuth.once("value", function(snapshot) {
        var key;  /* creating variables for keys */
        key = snapshot.child('giphyKey').val();
        //console.log(`cId: ${cid} cSec: ${csec}`);

        queryURL += "&api_key=" + key;
        //console.log(queryURL);

        // ? Ajax incoming
        $.ajax({
            url : queryURL,
            method : "GET"
        }).then( function(response) {
            var queryResult = response;
            var queryTitle = "";
            

            for(let i = 0; i < queryLimit; i++) {
                var queryPath = queryResult.data[i];

                imgStill = queryPath.images.fixed_height_still.url;
                imgAnimate = queryPath.images.fixed_height.url;
                queryRating = queryPath.rating;
                queryTitle = (queryPath.title).replace(/(GIF).*$/g, "");

                imageGen();
            }
        });
    });
}

function toggleAnimation(img){
    var state = img.attr("data-state");
        //console.log(state);

    state === "still" ?
        img.attr({
            "src": img.attr("data-animate"), 
            "data-state": "animate"
        }) :
        img.attr({
            "src": img.attr("data-still"), 
            "data-state": "still"
        });
}

function favorite(fav) {
    //favArray.push(fav);
    urlStill = urlJoiner(fav, "still");
    urlAnimate = urlJoiner(fav, "animate")

    var favFig = $("<figure>").append(
        $("<button class='favBtn'>").append(
            "<i class='fas fa-star'>",
            "<i class='far fa-star'>"
        ),
        $("<img>").attr({
            "id" : fav.id,
            "alt" : fav.title,
            "src" : urlStill,
            "data-state" : "still",
            "data-still" : urlStill,
            "data-animate" : urlAnimate
        }),
        $("<figcaption>").append(
            $("<p class='title'>").text(fav.title),
            $("<p>").text(`${fav.rating}-rated content`)
        )
    );

    $("#favorites .container").append(favFig);

    //console.log("fav.id: " + fav.id);
    localStorage[fav.id] = JSON.stringify(fav);
}

//shortening url for local storage
function urlCutter(img) {
    
    var str = img.attr("data-still");
    str = str.replace("https://", "");
    str = str.replace(
        "giphy.com/media/" + img.attr("id") + "/200_s.gif?cid=", ""
    );
    str = str.replace("&rid=200_s.gif", "");
    
    var res = str.split(/\W/g);
    console.log(res);

    var obj = {
        id: img.attr("id"),
        rating: img.attr("data-rating"),
        cid: res[1],
        server: res[0],
        animate: "200.gif",
        still: "200_s.gif",
        title: img.attr("alt")
    };
    console.log(obj);

    return obj;
}

function urlJoiner(fav, state){
    
    var urlFront = 
        "https://" + fav.server + 
        ".giphy.com/media/" + fav.id + 
        "/"; 
    var urlEnd = 
        "?cid=" + fav.cid +
        "&rid=";
    
    var urlAnimate = urlFront + fav.animate + urlEnd + fav.animate;
    var urlStill = urlFront + fav.still + urlEnd + fav.still;

    return state === "animate" ? urlAnimate :  urlStill;
    
}

// // ToDo: Create an array of starter topics

// // ToDo: Get input to add a new topic button

// // ToDo: set up ajax
// // ToDo: Create a variable for the api url and search topic

// Functions 
// // ToDo: make something to generate and append the buttons

// // ToDo: print 10 gif thumbnails to the page

// // ToDo: Show gif PG rating (better make it look nice)

// // ToDo: make gif start/stop running on click;
// // ToDO: make gif start on hover 


/**
 * ! Bonus
 * * Add a persistent favorites section (possibly with cookies)
 * * Make this responsive
 * * Integrate with other APIs
 * * make it so you can scroll down and get 10 more gifs
 */