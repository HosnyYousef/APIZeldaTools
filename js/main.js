

document.querySelector('.click').addEventListener('click', zeldaGame)

let zeldaArray = []

function zeldaGame () {
    let game = document.querySelector('input').value
    
    
 
    fetch(`https://zelda.fanapis.com/api/games?${game}`)
    .then(res => res.json()) // parse response as JSON
    .then(data => {
      for(let x = 0; x < data.data.length; x++) {
        zeldaArray.push(data.data[x])
      }

      // let resultBox = document.querySelector('.result')
      // resultBox.innerHTML = data.description
      console.log(zeldaArray)
      //console.log(data.data.creatures.food)
      document.querySelector('h2').innerText = zeldaArray[0].name
      document.querySelector('h3').innerText = zeldaArray[0].released_date
      document.querySelector('b').innerText = zeldaArray[0].description
    })
    .catch(err => {
        console.log(`error ${err}`)
    })
 

    start()    
}

function showDrink() {
  // Check if 'i' has reached the end of the array
  if (i >= zeldaArray.length) {
    stop();  // Stop the carousel
    return;  // Exit the function
  }

  // Otherwise, continue showing the data
  document.querySelector('h2').innerText = zeldaArray[i].name;
  document.querySelector('h3').innerText = zeldaArray[i].released_date;
  document.querySelector('b').innerText = zeldaArray[i].description;
  i++;
}

let intervalID;
let i = 0;  // Start from 0 to include the first element

function start() {
  intervalID = setInterval(showDrink, 5000);
}

function stop() {
  clearInterval(intervalID);
}

//============================//

// let zeldaArray = []

// what's this doing, and what's the point of this?
// ChatGPT
// The line let zeldaArray = [] is creating an empty array named zeldaArray.

// What's it doing?

// It declares a variable named zeldaArray and initializes it to an empty array [].
// What's the point of this?

// This empty array acts as a placeholder or a container to store data that will be fetched later from the API.
// When you make a request to the Zelda API in the zeldaGame function, you receive a list of game objects. You then use a loop to push each game object into zeldaArray.
// By storing the fetched data in zeldaArray, you can conveniently access and manipulate the game data throughout your code, like displaying it in a carousel fashion as is being done here.



// User
//  .then(data => {
//       for(let x = 0; x < data.data.length; x++) {
//         zeldaArray.push(data.data[x])
//       }

// what's this doing, and what's the point of this?
// ChatGPT
// This block of code is part of the process of fetching data from an API and is responsible for extracting relevant information and saving it in the zeldaArray.

// What's it doing?

// .then(data => {...}: This indicates that once the promise from the fetch is resolved (meaning, the data from the API is successfully fetched), the function inside .then() will execute.
// for(let x = 0; x < data.data.length; x++) {...}: This is a loop that iterates over each element in the data.data array, which is assumed to be part of the response from the API.
// zeldaArray.push(data.data[x]): For each iteration of the loop, it takes an element data.data[x] from the API response and adds (pushes) it to the zeldaArray.
// What's the point of this?

// The purpose is to populate the zeldaArray with data fetched from the API.
// This is useful because later in the code, zeldaArray is used to display information in a carousel. By populating it here, you ensure that when you want to display the data, it is readily available.



// User
//     start()    
// what's this doing, and what's the point of this?
// ChatGPT
// The start() function call starts a process known as a "carousel" that continuously displays data from zeldaArray on the webpage at regular intervals.

// What's it doing?

// start(): This function call triggers the start function defined later in the script.
// Inside the start function, there is setInterval(showDrink, 1000);, which is a JavaScript function that continuously executes the showDrink function every 1000 milliseconds (or 1 second).
// What's the point of this?

// The purpose is to initiate the process of cycling through the zeldaArray and displaying the game information on the webpage one after another.
// By calling start() here, you are ensuring that as soon as the data from the API is fetched and processed, the carousel starts showcasing the information without any additional action from the user.



// User
//   if (i >= zeldaArray.length) {
//     stop();  
//     return;  

// what's this doing, and what's the point of this?
// ChatGPT
// This block of code is checking if the variable i has reached or surpassed the total number of items in zeldaArray and, if so, it stops the carousel and exits the function.

// What's it doing?

// if (i >= zeldaArray.length): This checks if i, which keeps track of the current item being shown, is equal to or greater than the total number of items in zeldaArray.
// stop();: If the condition is true, it calls the stop function, which stops the carousel from continuing.
// return;: This exits the showDrink function immediately, not allowing any further code in the function to run.
// What's the point of this?

// The purpose is to prevent errors and ensure that the carousel doesn't try to display non-existent data.
// Once all items from zeldaArray have been shown, it stops the carousel gracefully, preventing any attempts to access data beyond the array's limits.



// User
// let intervalID;
// let i = 0; 

// what's this doing, and what's the point of this?
// ChatGPT
// This code is initializing two variables, intervalID and i, which will be used later in the script.

// 1. let intervalID;

// What's it doing? Declaring a variable named intervalID without assigning a value to it initially.
// What's the point of this? This variable will later be used to store the ID returned by setInterval, allowing you to reference and clear the interval (stop the repetitive function calls) when needed.
// 2. let i = 0;

// What's it doing? Declaring a variable named i and initializing it with the value 0.
// What's the point of this? This variable i is used as a counter to keep track of the current position in the zeldaArray. Starting at 0 ensures that you begin with the first element of the array when displaying data in the carousel.



// User
// setInterval

// what's this doing, and what's the point of this?
// ChatGPT
// setInterval

// What's it doing?

// setInterval is a JavaScript function that repeatedly executes a specified function or code at fixed time intervals, which are set in milliseconds.
// Example:

// javascript
// Copy code
// let intervalID = setInterval(myFunction, 2000);
// How it works:

// In this example, myFunction would be called every 2000 milliseconds, or every 2 seconds.
// setInterval returns an ID (which is stored in intervalID), that can be used later to stop the repetitions using clearInterval.
// What's the point of this?

// It's used to create periodic actions in your web page, such as animations, updates, or in your case, to cycle through elements like a carousel.
// In the context of your code, setInterval is being used to change the displayed game information every few seconds, creating a carousel effect.



// User
// function stop() {
//   clearInterval(intervalID);
// }

// what's this doing, and what's the point of this?
// ChatGPT
// function stop() { clearInterval(intervalID); }

// What's it doing?

// This stop function calls clearInterval, which stops the repeating action set up by setInterval.
// It uses the intervalID (which was returned by setInterval) as an argument to know which interval to stop.
// Example:

// javascript
// Copy code
// let intervalID = setInterval(myFunction, 2000);  // Starts repeating myFunction every 2 seconds
// ...
// clearInterval(intervalID);  // Stops the repetitions
// What's the point of this?

// The stop function provides a way to stop the carousel from continuously showing game information.
// By stopping the interval, you ensure that the carousel doesn't run indefinitely and can be controlled based on certain conditions (like when it has shown all the items).