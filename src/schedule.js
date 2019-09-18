/* eslint-disable max-len */
const fetch = require('node-fetch');

// this will probably need to be messed with a lot, but I figure it's a good starting point
const stickerWeights = [4, 2, 1];

const slots = [
  {
    day: 'monday',
    start: '9:20am',
    end: '10:30am',
    mega: '0',
    classes: [],
  },
  {
    day: 'monday',
    start: '10:35am',
    end: '11:45am',
    mega: '0',
    classes: [],
  },
  {
    day: 'monday',
    start: '12:30pm',
    end: '1:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'monday',
    start: '1:30pm',
    end: '2:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'monday',
    start: '2:30pm',
    end: '3:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'tuesday',
    start: '9:20am',
    end: '10:30am',
    mega: '0',
    classes: [],
  },
  {
    day: 'tuesday',
    start: '10:35am',
    end: '11:45am',
    mega: '0',
    classes: [],
  },
  {
    day: 'tuesday',
    start: '12:30pm',
    end: '1:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'tuesday',
    start: '1:30pm',
    end: '2:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'tuesday',
    start: '2:30pm',
    end: '3:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'wednesday',
    start: '9:20am',
    end: '10:30am',
    mega: '0',
    classes: [],
  },
  {
    day: 'wednesday',
    start: '10:35am',
    end: '11:45am',
    mega: '0',
    classes: [],
  },
  {
    day: 'wednesday',
    start: '12:30pm',
    end: '3:25pm',
    mega: '1',
    classes: [],
  },
  {
    day: 'thursday',
    start: '9:20am',
    end: '10:30am',
    mega: '0',
    classes: [],
  },
  {
    day: 'thursday',
    start: '10:35am',
    end: '11:45am',
    mega: '0',
    classes: [],
  },
  {
    day: 'thursday',
    start: '12:30pm',
    end: '1:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'thursday',
    start: '1:30pm',
    end: '2:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'thursday',
    start: '2:30pm',
    end: '3:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'friday',
    start: '9:20am',
    end: '11:45am',
    mega: '1',
    classes: [],
  },
  {
    day: 'friday',
    start: '12:30pm',
    end: '1:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'friday',
    start: '1:30pm',
    end: '2:25pm',
    mega: '0',
    classes: [],
  },
  {
    day: 'friday',
    start: '2:30pm',
    end: '3:25pm',
    mega: '0',
    classes: [],
  },
];

// fetches data from stickering system, page can be 'classes' or 'students'
async function fetchData(page) {
  const res = await fetch(`https://stickers.pscs.org/feed/${page}.php`);
  return res.json();
}

// checks to make sure classes can be placed / swapped into certain slots
function canBePlaced(scheduleData, offering, slot) {
  const classData = scheduleData.filter(o => slot.classes.includes(o.classId));

  // make sure mega status matches that of the slot
  if (offering.isMega !== slot.mega) {
    return false;
  }

  // for each slot
  Object.values(classData).forEach((e) => {
    // if the facilitator is the same
    if (e.facilitator === offering.facilitator) {
      return false;
    }
    // if there are multiple facilitators and one is the same
    if (e.facilitator.split('&').includes(offering.facilitator)) {
      return false;
    }
    // if there are multiple facils on your class and one is the same
    if (offering.facilitator.split('&').includes(e.facilitator)) {
      return false;
    }
    return true;
  });

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
        // idk what I was thinking when I wrote this
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
  scheduleData.filter(o => o.facilitator === facilitators[0]).forEach((offering) => {
    Object.keys(slots).every((slot) => {
      if (canBePlaced(scheduleData, offering, slots[slot])) {
        slots[slot].classes.push(offering.classId);
        return false; // returning false breaks the loop here
      }
      return true;
    });
  });

  // after the first facil's classes have been placed, remove them from facil array
  facilitators.shift();

  // loop through remaining facilitators
  facilitators.forEach((facilitator) => {
    const facilHurt = [];
    const placement = [];
    const classIds = [];

    // loop through all classes taught by the currently selected facilitator
    Object.values(slots).forEach((slot) => {
      const classHurt = [];
      // for each school day
      scheduleData.filter(offering => offering.facilitator === facilitator).forEach((offering) => {
        classIds.push(offering.classId);
        // calculate and append hurt
        classHurt.push(evaluateHurt(scheduleData, offering.classId, slot.classes));
      });
      facilHurt.push(classHurt);
    });


    // for each slot
    Object.keys(slots).forEach((slot) => {
      // while true
      for (; ;) {
        // find the minimum hurt and store the index
        const minHurt = Math.min(...facilHurt[slot]);
        const minIndex = facilHurt[slot].indexOf(minHurt);

        // check if the class has already been (tentatively) placed in the schedule
        if (placement.includes(minIndex)) {
          // check if the class we are currently scheduling has a lower hurt than the one that was already scheduled
          if (facilHurt[placement.indexOf(minIndex)][minIndex] > minHurt) {
            // swap the class we are currently scheduling and the previously scheduled class
            if (canBePlaced(scheduleData, scheduleData.filter(offering => offering.classId === classIds[minIndex])[0], slots[slot])) {
              placement[placement.indexOf(minIndex)] = null;
              placement.push(minIndex);
              break;
            } else {
              if (facilHurt[slot][minIndex] === 100) {
                placement.push(null);
                break;
              }
              facilHurt[slot][minIndex] = 100;
            }
          } else {
            // if every class in this time slot has already been checked than move onto the next time slot
            if (facilHurt[slot][minIndex] === 100) {
              placement.push(null);
              break;
            }
            facilHurt[slot][minIndex] = 100;
          }
        } else if (canBePlaced(scheduleData, scheduleData.filter(offering => offering.classId === classIds[minIndex])[0], slots[slot])) {
          placement.push(minIndex);
          break;
        } else {
          if (facilHurt[slot][minIndex] === 100) {
            placement.push(null);
            break;
          }
          facilHurt[slot][minIndex] = 100;
        }
      }
    });
    // take the 'placement' variable and convert it into actually scheduled classes
    placement.forEach((classIndex, slot) => {
      if (classIndex === null) return;
      slots[slot].classes.push(classIds[classIndex]);
    });
  });

  // log all of the classes at their specific times
  Object.values(slots).forEach((slot) => {
    console.log(`${slot.day} ${slot.start}: `);
    slot.classes.forEach((offering) => {
      const c = scheduleData.filter(o => o.classId === offering)[0];
      console.log(`\t${c.className} (${c.facilitator})`);
    });
  });
}

buildHurts();
