

document.querySelector('.click').addEventListener('click', zeldaGame)

function zeldaGame () {
    let game = document.querySelector('input').value
    
    
    let zeldaArray = []

    fetch(`https://zelda.fanapis.com/api/games?${game}`)
    .then(res => res.json()) // parse response as JSON
    .then(data => {
      for(let x = 0; x < data.length; x++) {
        zeldaArray.push(data[x])
      }

      // let resultBox = document.querySelector('.result')
      // resultBox.innerHTML = data.description
      console.log(data)
      //console.log(data.data.creatures.food)
      document.querySelector('h2').innerText = zeldaArray[0].name
      document.querySelector('h3').innerText = zeldaArray[0].released_date
      document.querySelector('b').innerText = zeldaArray[0].description
    })
    .catch(err => {
        console.log(`error ${err}`)
    })
 
}


// document.querySelector('.click').addEventListener('click', getDrink)

// function getDrink () {
//     let drink = document.querySelector('input').value.replaceAll(' ', '_')
    
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