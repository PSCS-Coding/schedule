/* eslint-disable max-len */
const fetch = require('node-fetch');

// this will probably need to be messed with a lot, but I figure it's a good starting point
const stickerWeights = [4, 2, 1];

const slots = {
  monday: [
    {
      start: '9:20am',
      end: '10:30am',
      block: false,
      classes: [],
    },
    {
      start: '10:35am',
      end: '11:45am',
      block: false,
      classes: [],
    },
    {
      start: '12:25pm',
      end: '1:20pm',
      block: true,
      classes: [],
    },
    {
      start: '1:25pm',
      end: '2:20pm',
      block: false,
      classes: [],
    },
    {
      start: '2:25pm',
      end: '3:15pm',
      block: false,
      classes: [],
    },
  ],
};

// fetches data from stickering system, page can be 'classes' or 'students'
async function fetchData(page) {
  const res = await fetch(`https://stickers.pscs.org/feed/${page}.php`);
  return res.json();
}

// checks to make sure classes can be placed / swapped into certain slots
function canBePlaced(scheduleData, classId, classes) {
  return true;
}

// sees how many people would be hurt if a class is put in a slot
function evaluateHurt(scheduleData, classId, classes) {
  // reset hurt counter
  let hurt = 0;
  // get all stickers on the class we will be checking
  const classStickers = scheduleData.filter(offering => offering.classId === classId)[0].stickers;

  // loop through each class in the slot
  classes.forEach((offering) => {
    // loop through each sticker on that class
    scheduleData.filter(o => o.classId === offering)[0].stickers.forEach((sticker) => {
      // if the list of students that have stickered the class we are testing includes a student that has stickered a class in this slot
      if (classStickers.map(classSticker => classSticker.studentId).includes(sticker.studentId)) {
        const stickerValues = [stickerWeights[sticker.priority - 1], stickerWeights[classStickers.filter(s => s.studentId === sticker.studentId)[0].priority - 1]];
        hurt += stickerValues.sort((a, b) => a - b)[0];
      }
    });
  });
  return hurt;
}

// builds the inital hurt grid
async function buildHurts() {
  // fetch class data from sticking system
  const scheduleData = await fetchData('classes');

  // construct set of all facilitators
  const facilitatorSet = new Set();
  scheduleData.forEach((offering) => {
    if (offering.facilitator) {
      facilitatorSet.add(offering.facilitator);
    }
  });

  // convert facilitators set to array and sort it by how many &s there are so the multi facil classes are first
  const facilitators = Array.from(facilitatorSet).sort((a, b) => (b.match(/&/g) || []).length - (a.match(/&/g) || []).length);

  // this is where we should place the first facil's classes onto the schedule somehow
  scheduleData.filter(offering => offering.facilitator === facilitators[0]).forEach((offering) => {
    Object.keys(slots).forEach((weekday) => {
      Object.keys(slots[weekday]).every((slot) => {
        if (canBePlaced(scheduleData, offering.classId, slots[weekday][slot])) {
          slots[weekday][slot].classes.push(offering.classId);
          return false; // returning false breaks the loop here
        }
        return true;
      });
    });
  });

  // after the first facil's classes have been placed, remove them from facil array
  facilitators.shift();

  // loop through remaining facilitators
  facilitators.forEach((facilitator) => {
    const facilHurt = [];

    // loop through all classes taught by the currently selected facilitator
    scheduleData.filter(offering => offering.facilitator === facilitator).forEach((offering) => {
      const classHurt = [];
      Object.keys(slots).forEach((weekday) => {
        Object.values(slots[weekday]).forEach((slot) => {
          classHurt.push(evaluateHurt(scheduleData, offering.classId, slot.classes));
        });
      });
      facilHurt.push(classHurt);
    });
    console.log(facilHurt);
  });
}

buildHurts();

// stuff below this is for calculating the proper schedule

/*
function scheduleTest() {
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


  placement.forEach((e, i) => {
    let newString = `${slots[i]}`;
    // eslint-disable-next-line eqeqeq
    if (e != undefined) {
      newString += ` ${classes[e]}`;
    }
  });
}
*/
