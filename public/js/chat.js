const socket = io();

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    // Visible height
    const visibleHeight = $messages.offsetHeight;
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight; 
    if (containerHeight - newMessageHeight <= scrollOffset ) {
        $messages.scrollTop = $messages.scrollHeight; 
    }
}

socket.on("message", (message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text, 
        createdAt: moment(message.createdAt).format("k:mm ")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (location)=>{    
    const link = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url, 
        createdAt: moment(location.createdAt).format("k:mm")
    })
    $messages.insertAdjacentHTML("beforeend", link);
    autoscroll();
})

socket.on("roomData", ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, { room, users })
    document.querySelector("#sidebar").innerHTML = html;
})

// Elements
const $messageForm = document.querySelector("#sendMessage");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

document.querySelector("#sendMessage").addEventListener("submit", (e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled");
    socket.emit("sendMessage", e.target.elements.message.value, (error)=>{
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if (error) return console.log(error);
        console.log("The message was delivered.");        
    }
    )
})
$locationButton.addEventListener("click", (e)=>{
    if (!navigator.geolocation){
        return alert("Geolocation is not supported by your browser.")
    }
    $locationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position)=>{       
        socket.emit("sendLocation", {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, (error)=>{
            if (error) {
                alert (error);
                location.href= "/";
            }
            console.log("Location shared")
            $locationButton.removeAttribute("disabled");
        })        
    })
})

socket.emit("join", {username, room}, (error)=>{
    if (error) {
        alert(error);
        location.href = "/";
    }

});

