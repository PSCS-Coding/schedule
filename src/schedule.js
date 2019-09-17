const fetch = require('node-fetch');

fetch('https://stickers.pscs.org/feed/classes.php')
  .then(res => res.json())
  .then(json => console.log(json));


const slots = ['Mon 9am', 'Mon 10am', 'Mon 11am', 'Mon 1pm', 'Mon 2pm', 'Tue 9am', 'Tue 10am', 'Tue 11am', 'Tue 1pm', 'Tue 2pm', 'Wed 9am', 'Wed 10am', 'Wed 11am', 'Wed 1pm', 'Wed 2pm'];
const classes = ['High School Jazz Immersion', 'Diverse Voices and Yummy Things', '9th - 12th grade bands', 'Mishmash'];
const placement = [];
const facilhurt = [
  [9, 1, 6, 6],
  [1, 3, 5, 5],
  [3, 1, 6, 1],
  [2, 5, 5, 2],
  [5, 6, 2, 2],
  [5, 6, 5, 2],
  [3, 1, 4, 6],
  [1, 3, 5, 5],
  [3, 1, 6, 1],
  [2, 5, 5, 2],
  [5, 6, 2, 2],
  [5, -6, 5, 2],
  [-3, 1, 4, 6],
  [1, 3, 5, -5],
  [3, 1, -6, 1],
];


slots.forEach((value, slot) => {
  // console.log(`${slot}, ${value}, ${facilhurt[slot]}`);
  for (;;) {
    const minHurt = Math.min(...facilhurt[slot]);
    const minIndex = facilhurt[slot].indexOf(minHurt);
    if (placement.includes(minIndex)) {
      if (facilhurt[placement.indexOf(minIndex)][minIndex] > minHurt) {
        placement[placement.indexOf(minIndex)] = null;
        placement.push(minIndex);
        break;
      } else {
        if (facilhurt[slot][minIndex] === 100) {
          placement.push(null);
          break;
        }
        facilhurt[slot][minIndex] = 100;
      }
    } else {
      placement.push(minIndex);
      break;
    }
  }
});

// console.log(placement);

placement.forEach((e, i) => {
  let newString = `${slots[i]}`;
  // eslint-disable-next-line eqeqeq
  if (e != undefined) {
    newString += ` ${classes[e]}`;
  }
  console.log(newString);
});
