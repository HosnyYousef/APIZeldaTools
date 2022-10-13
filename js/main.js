
//The user will enter a cocktail. Get a cocktail name, photo, and instructions and place them in the DOM



// document.querySelector('.click').addEventListener('click', getDrink)

document.querySelector('.click').addEventListener('click', getDrink)

function getDrink () {
    let drink = document.querySelector('input').value.replaceAll(' ', '_')
    
    fetch(`https://botw-compendium.herokuapp.com/api/v2/entry/${drink}`)
    .then(res => res.json()) // parse response as JSON
    .then(data => {
      let resultBox = document.querySelector('.result')
      resultBox.innerHTML = data.data.description
      console.log(data)
      //console.log(data.data.creatures.food)
      document.querySelector('h2').innerText = data.data.name
      document.querySelector('img').src = data.data.image
      document.querySelector('h3').innerText = data.data.description
    })
    .catch(err => {
        console.log(`error ${err}`)
    })
 


}

document.querySelector('.click').addEventListener('click', getDrink)

function getDrink () {
    let drink = document.querySelector('input').value.replaceAll(' ', '_')
    
    fetch(`https://botw-compendium.herokuapp.com/api/v2/entry/${drink}`)
    .then(res => res.json()) // parse response as JSON
    .then(data => {
      let resultBox = document.querySelector('.result')
      resultBox.innerHTML = data.data.description
      console.log(data)
      //console.log(data.data.creatures.food)
      document.querySelector('h2').innerText = data.data.name
      document.querySelector('img').src = data.data.image
      document.querySelector('h3').innerText = data.data.description
    })
    .catch(err => {
        console.log(`error ${err}`)
    })
 


}

// document.querySelector('button').addEventListener('click', getDrink)

// function getDrink () {
//     let drink = document.querySelector('input').value
    
//     fetch(`https://botw-compendium.herokuapp.com/api/v2/entry/${drink}`)
//     .then(res => res.json()) // parse response as JSON
//     .then(data => {
//       console.log(data.data.creatures.food)
//       document.querySelector('h2').innerText = data.data.creatures.food[0].name
//       document.querySelector('img').src = data.data.creatures.food[0].image
//       document.querySelector('h3').innerText = data.data.creatures.food[0].description
//     })
//     .catch(err => {
//         console.log(`error ${err}`)
//     })
 


// }


// https://botw-compendium.herokuapp.com/api/v2/entry/white-maned_lynel

// https://botw-compendium.herokuapp.com/api/v2

// `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drink}&filter.php?a=Non_Alcoholic`


 // `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drink}&filter.php?a=Non_Alcoholic`

// right
//  `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drink}`

// fail
// `https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=${drink}`



//right way of doing it

// document.querySelector('.click').addEventListener('click', getDrink)

// function getDrink () {
//     let drink = document.querySelector('input').value
    
//     fetch(`https://botw-compendium.herokuapp.com/api/v2/entry/${drink}`)
//     .then(res => res.json()) // parse response as JSON
//     .then(data => {
//       let resultBox = document.querySelector('.result')
//       resultBox.innerHTML = data.data.description
//       console.log(data)
//       //console.log(data.data.creatures.food)
//       document.querySelector('h2').innerText = data.data.name
//       document.querySelector('img').src = data.data.image
//       document.querySelector('h3').innerText = data.data.description
//     })
//     .catch(err => {
//         console.log(`error ${err}`)
//     })

// }