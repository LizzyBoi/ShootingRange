
window.onload = function(){
    const el = document.getElementById("speedInput");
    console.log(el);
    el.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("speedInputButton").click();
        }
    });
};



function updateSlider(){
    document.getElementById('speedSlider').value = document.getElementById('speedInput').value
    document.getElementById('currentSpeed').innerHTML = document.getElementById('speedInput').value
}

function incrementSlider(){
    var increment = 5
    document.getElementById('speedSlider').value = parseInt(document.getElementById('speedSlider').value) + increment
}

    