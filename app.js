let colonyName = "Jamestown";
const GAME_START_POPULATION = 100;
const GAME_START_FOOD = 208;
const GAME_START_EQUIPMENT = 150;
const GAME_START_SHELTER = 104;
const BASE_FARMER_PRODUCTION = 2;
// TODO simple for now, but should be [0.1,0.4,0.5], etc. basically always do 1st not 2
// 1st weight corresponds to outcome 1, so update as necessary
const FARMER_EVENT_WEIGHTS = [1000, 0.0001]
// snapshot of start of year population to not mess up consumption/production from events
// ^- population will consume based on end population but produce based on start (makes game easier)
// ^- avoids quick gameover scenarios
// ^- EXCLUDES NEW ARRIVALS (makes it easier so people have 1 year to accommodate the food needs of new colonists)
let yearStartPopulation = GAME_START_POPULATION;
let yearEndPopulation = yearStartPopulation;
let newArrivals = 0;  // new arrivals do not consume the year they barely arrived (makes it easier to manage)
let farmersInput = 0;
let huntersInput = 0;
let buildersInput = 0;
let guardsInput = 0;
let farmerModifier = 1; // starts at 1 by default
let totalFood = GAME_START_FOOD;
let totalEquipment = GAME_START_EQUIPMENT;
let totalShelter = GAME_START_SHELTER;
let totalDefense = 0;
let currentYear = 1606;
let learnedFarming = false;  // don't learn farming until 1608 event (or so)

// TODO WHAT ABOUT EVENTS WITH "2nd" page explaining effects that happen depending on choice?
// TODO REMMEBER THAT YOU CULDNT EVEN MAKE FOOD UNTIL FORCED EVENT AT 1609!!!
// list of events
/**
    Each Event object has:
    weight - chance from 0 to 1 of happening (0.5 = 50%) <- don't need weight attribute if forced
    initialEffect - effect that happens before choices are offered
    options - list of effects user can choose
    image - image to display
*/

// TODO SELECT IMAGE HERE TOO
// TODO use speical like @ to indicate where to put colony naame! (replace @ with colony name)
// only support 3 buttons atm
let eventList = [
    {
        weight: 1,
        initialEffect: {
            effect: function() {
                console.log("fire happening");
                totalShelter -= 30;
            },
            text: "A grand fire burned down several houses. You lost 30 shelter."
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "fireEvent.jpg"
    },
    {
        weight: 1,
        initialEffect: {
            effect: function() {
                yearEndPopulation -= 30;
            },
            text: "A plague sweeps through town. Lost 30 people."
        },
        options: [
        {
            effect: function() {},
            text: "QUARANTINE."
        }
        ],
        image: "plague.jpg"
    },
    {
        weight: 1,
        initialEffect: {
            effect: function() {
                newArrivals += 148;
            },
            text: "Rejoice! 148 new colonists arrive at the end of the year but do not have food with them. You must provide for them next year!"
        },
        options: [
        {
            effect: function() {},
            text: "We welcome these huddled masses."
        }
        ],
        image: "arrivalNoFood.jpg"
    },
    {
        weight: 1,
        initialEffect: {
            effect: function() {
                newArrivals += 100;
                totalFood += 100;
                totalEquipment += 100;
            },
            text: "Good, heavens! 100 new wealthy colonists arrive, bringing 100 Food and Equipment!"
        },
        options: [
        {
            effect: function() {},
            text: "Glorious day! May we thrive!"
        }
        ],
        image: "arrivalWithFood.jpg"
    },
    {
        weight: 1,
        initialEffect: {
            effect: function() {
                yearEndPopulation -= 1;
            },
            text: "A murderer killed 1 person. You can either sentence the criminal to death, or assign a Guard to watch over him, reducing defense by 10%?"
        },
        options: [
        {
            effect: function() {
                yearEndPopulation -=1;
            },
            text: "An eye for an eye. Kill him! (-1 population)"
        },
        {
            effect: function() {
                totalDefense -= 0.1;
            },
            text: "We need every person we can get. Spare him. (-10% Defense)"
        }
        ],
        image: "fireEvent.jpg"
    }
];

// learn farming
let forcedFarmingEvent = {
    initialEffect: {
        effect: function() {
            console.log("farming happening");
        },
        text: "You can learn to Farm for a cost of 30 equipment OR steal 30 food from natives (and never learn to farm)."
    },
    options: [
    {
        effect: function() {
            console.log("farm chosen");
            learnedFarming = true;
            totalEquipment -= 30;
        },
        text: "Learn Farming. -30 Equipment."
    },
    {
        effect: function() {
            console.log("attack natives");
            totalFood += 30;
        },
        text: "Attack Natives. +30 Food."
    }
    ],
    image: "learnFarmingEvent.jpg"
};

// introduction of slavery 1619
let forcedSlaveryEvent = {
    initialEffect: {
        effect: function() {
            console.log("slavery happening");
            farmerModifier *= 2;
            newArrivals += 100;
        },
        text: "100 Slaves arrive for the first time. Food production increased by 2x. "
    },
    options: [
    {
        effect: function() {},
        text: "A dark day for freedom."
    }
    ],
    image: "slavery.jpg"
};

/**
    Each farmer event object has:
    weight - chance from 0 to 1 of happening (0.5 = 50%)
    farmerProductionModifier - 2 = 2 times farming output
    text - text of event (both flavor and effect)
*/
let farmerEventList = [
    {
        weight: 1,
        farmerProductionModifier: 1,
        text: "Normal Harvest: Output 1x."
    },
    {
        weight: 0.0001,
        farmerProductionModifier: 0.5,
        text: "Drought halves farming output: Output 0.5x."
    }
];


let flagFile = document.getElementById("flagFile");
let flagPreviewTitle = document.getElementById("flagPreviewTitle");
let flagPreviewGame = document.getElementById("flagPreviewGame");

flagFile.addEventListener("change", function() {
  showImage(this);
});

// BUG: on restart (if file was selected)file text doesn't reset, and Confirm button is still enabled
// display chosen flag
function showImage(input) {
  var reader;
  if (input.files && input.files[0]) {
    reader = new FileReader();
    reader.onload = function(e) {
      flagPreviewTitle.setAttribute('src', e.target.result);
      flagPreviewGame.setAttribute('src', e.target.result);
    }
    reader.readAsDataURL(input.files[0]);
    flagPreviewTitle.style.display = "block";
    // after image is selected enable start button
    document.getElementById("startButton").disabled = false;
  }
}

// use given colony name
// function setupGame() {
//     colonyName = document.getElementById("name").value;
//     // alert(colonyName);
//     // loadGame();
//     loadTutorial();
// }

// load tutorial page
function loadTutorial() {
     colonyName = document.getElementById("name").value;
    let introVideo = document.getElementById("introVideo");
    introVideo.pause();
    const initialScreen = document.getElementById("initialScreen");
    initialScreen.style.display = "none";
    const tutorialScreen = document.getElementById("tutorialScreen");
    tutorialScreen.style.display = "block";
}

// start game
// TODO have a tutorial page before this!
function loadGame() {
    // TODO: STOP VIDEO DON'T JUST HIDE!
    // swap screens from start to game view
    // let introVideo = document.getElementById("introVideo");
    // introVideo.pause();
    const tutorialScreen = document.getElementById("tutorialScreen");
    tutorialScreen.style.display = "none";
    const gameScreen = document.getElementById("gameScreen");
    gameScreen.style.display = "block";

    // setup initial values
    let colonyNameText = document.getElementById("colonyName");
    let populationText = document.getElementById("currentPopulation");
    let foodText = document.getElementById("currentFood");
    let equipmentText = document.getElementById("currentEquipment");
    let shelterText = document.getElementById("currentShelter");
    let defenseText = document.getElementById("currentDefense");
    colonyNameText.textContent = "Colony: " + colonyName;
    // changing text messes up style
    // colonyNameText.style.backgroundColor = "lightblue";
    populationText.textContent = "Population: " + GAME_START_POPULATION;
    foodText.textContent = "Food: " + GAME_START_FOOD;
    equipmentText.textContent = "Equipment: " + GAME_START_EQUIPMENT;
    shelterText.textContent = "Shelter: " + GAME_START_SHELTER;
    defenseText.textContent = "Defense: 0%";

    // cannot use farmers until 1608 event where you learn how to!
    document.getElementById("farmersInput").disabled = true;
}

// validate and process job assignments
function confirmJobs() {
    const rawFarmersInput = parseInt(document.getElementById("farmersInput").value, 10);
    const rawHuntersInput = parseInt(document.getElementById("huntersInput").value, 10);
    const rawBuildersInput = parseInt(document.getElementById("buildersInput").value, 10);
    const rawGuardsInput = parseInt(document.getElementById("guardsInput").value, 10);
    // if invalid input (e.g., if string characters included)
    if (isNaN(rawFarmersInput)||isNaN(rawBuildersInput)||isNaN(rawHuntersInput)||isNaN(rawGuardsInput)) {
        displayErrorMessage("Invalid input. Must be an integer");
    } else {
        // valid integer
        farmersInput = rawFarmersInput;
        huntersInput = rawHuntersInput;
        buildersInput = rawBuildersInput;
        guardsInput = rawGuardsInput;
        const jobsAssigned = farmersInput+huntersInput+buildersInput+guardsInput;
        if (jobsAssigned > yearStartPopulation) {
            displayErrorMessage("Assigned more jobs than people. Remove "+(jobsAssigned - yearStartPopulation)+" jobs.");
        } else if (jobsAssigned > totalEquipment) {
            displayErrorMessage("Assigned more jobs than equipment. Remove "+(jobsAssigned - totalEquipment)+ " jobs.");
        } else if (jobsAssigned < yearStartPopulation) {
            // recommend to add mininum between equipment available for jobs or remaining population-
            //   -whichever one is a limiting factor
            displayErrorMessage("Assigned less jobs than people. Add "
                +Math.min(yearStartPopulation - jobsAssigned, totalEquipment - jobsAssigned)+" more jobs.");
        } else {
            // input is validated so we can move on to next step.
            rollEvent();
            console.log("inputs: "+farmersInput+", "+huntersInput+", "+buildersInput+", "+guardsInput);
        }
    }
}

// TODO UPDATE RESOURCE PAGE ON EVERY CHANGE!!!! (either particular change or all of it)
// make event roll, offer choices, and calculate gains/losses
function rollEvent() {
    // disable input
    document.getElementById("farmersInput").disabled = true;
    document.getElementById("huntersInput").disabled = true;
    document.getElementById("buildersInput").disabled = true;
    document.getElementById("guardsInput").disabled = true;
    document.getElementById("confirmJobs").disabled = true;
    document.getElementById("errorPopup").style.display = "none";
    // hardcoded atm
    document.getElementById("endEventButton1").style.display = "none";
    document.getElementById("endEventButton2").style.display = "none";
    document.getElementById("endEventButton3").style.display = "none";

    // show event dialog
    document.getElementById("eventDialog").style.display = "block";
    // start updated (yearEnd) population at yearstart amount
    yearEndPopulation = yearStartPopulation;

    // forcedFarmingEvent
    // forced event to offer to learn Farming
    // TODO ADD BUTTONS FOR EACH OPTION
    let chosenEvent = {};
    if (currentYear === 1608) {
        chosenEvent = forcedFarmingEvent;
    } else if (currentYear === 1619) {
        chosenEvent = forcedSlaveryEvent;
    } else {
        // random choice event
        let eventWeights = [];
        for (const eventItem of eventList) {
            eventWeights.push(eventItem.weight);
        }
        const eventRoll = weightedRandomChoice(eventList.length, eventWeights);
        chosenEvent = eventList[eventRoll];
        console.log("event roll: " + eventRoll);
    }
    // todo change vent image
    document.getElementById("eventImage").src = chosenEvent.image;
    document.getElementById("eventText").textContent = chosenEvent.initialEffect.text;
    // document.getElementById("eventEffects").textContent = chosenEvent.effectText;
    // TODO make button execute what option was chosen (maybe just store index in button option)
    for (let i = 0; i < chosenEvent.options.length; i++) {
        let optionButton = document.getElementById("endEventButton" + (i+1));
        optionButton.style.display = "block";
        optionButton.value = chosenEvent.options[i].text;
        // wrapping function so event always moves forwards and updates
        optionButton.onclick = function() {
            chosenEvent.options[i].effect();
            updateResources();
            endRolls();
        }
    }
    // document.getElementById("endEventButton").style.display = "block";
    // TODO HISTORY OF EVENT EFFECTS SOMEHOW!
    // show and execute effect of events (starting from 0)
    chosenEvent.initialEffect.effect();
    // TODO update inthe middle of event "steps" after choices are made?
    updateResources();
    // TODO update sources AND move event forward on click...
    // if (eventRoll === 0) {
    //     // do event effects 1
    //     document.getElementById("eventText").textContent = "event 1";
    //     document.getElementById("eventEffects").textContent = "population -50";
    //     yearEndPopulation -= 50;
    //     console.log("population: " + yearEndPopulation);
    //     document.getElementById("endEventButton").style.display = "block";
    // }
    // TODO do NOT add to population from new arrivals until end roll!!! Only decrease
    // TODO  DO AN EVENT WITH MULTIPLE OPTIONS (have it in the div already toggleable)
    // TODO RESET YEAR START ON NEXT YEAR AND OTHER INPUTS, ETC!
}

// close event dialog, show harvest/hunter and other roll results
function endRolls() {
    // document.getElementById("endEventButton").style.display = "none";
    // TODO MAKE SURE THE OTHER POSSIBLE BUTTONS ARE TURNED OFF
    document.getElementById("eventDialog").style.display = "none";
    document.getElementById("yearResults").style.display = "block";
    document.getElementById("gameOver").style.display = "none";

    // calculate rolls
    // weighted farmer rolls
    // event 1
    // const farmerRoll = weightedRandomChoice(FARMER_EVENT_WEIGHTS.length, FARMER_EVENT_WEIGHTS);
    let farmerWeights = [];
    for (const farmerEvent of farmerEventList) {
        farmerWeights.push(farmerEvent.weight);
    }
    const farmerRoll = weightedRandomChoice(farmerEventList.length, farmerWeights);
    let chosenFarmerEvent = farmerEventList[farmerRoll];
    // document.getElementById("farmerRoll").textContent = chosenFarmerEvent.text;
    farmerModifier *= chosenFarmerEvent.farmerProductionModifier;
    // if (farmerRoll===0) {
    //     document.getElementById("farmerRoll").textContent ="Farmer Roll: " + 1;
    // } else if (farmerRoll===1) {
    //     // event 2
    //     const modifier = 0.5;
    //     farmerModifier *= modifier;
    //     document.getElementById("farmerRoll").textContent ="Farmer Roll: " + modifier;
    // }
    // even-chance hunter rolls. 1/3rd chance for 0, 1, or 2 food
    const hunterRoll = Math.floor(Math.random() * 3);

    // calculate production, then consume, and negative effects calculated for deficit
    // food production
    let producedFarmerFood = Math.round(farmersInput * farmerModifier * BASE_FARMER_PRODUCTION);
    let producedHunterFood = huntersInput * hunterRoll;
    let producedSumFood = producedFarmerFood + producedHunterFood;
    let producedShelter = buildersInput * 10;  // shelter from builders
    let producedDefense = guardsInput * .1;   // each guard adds 10% defense;
    document.getElementById("farmerRoll").textContent =
        chosenFarmerEvent.text +
        " Farmers Produced Total of: "+producedFarmerFood + " Food.";
    // TODO say different things based on hunterRoll
    document.getElementById("hunterRoll").textContent = "Hunter Roll: " + hunterRoll +
        ". Hunters produced: " + producedHunterFood + " Food";

    // add production to stockpile then consume
    totalFood += producedSumFood;
    totalShelter += producedShelter;
    totalDefense = producedDefense;
    // consume resources, then apply negative effects (if applicable)
    totalFood -= yearEndPopulation;
    document.getElementById("netFood").textContent = "Total food produced= "+producedSumFood + " Food."
        +" Food consumed= " + yearEndPopulation + " Food. Final Food Total= " +totalFood + " Food.";
    // if not enough food for each person, reduce population by difference
    if (totalFood < 0) {
        yearEndPopulation += totalFood; // total food would be negative
        document.getElementById("foodEffects").textContent = "Not enough food, " + totalFood + " people died of hunger!";
    } else {
        // enough food for all
        document.getElementById("foodEffects").textContent = "Enough food for everyone this year. No hunger.";
    }
    document.getElementById("shelterProduction").textContent = "Builders produced: " + producedShelter
    +". Total Shelter= " + totalShelter;
    // more shelter losses increases amount of deaths (random roll)
    let netShelter = totalShelter - yearEndPopulation;
    if (netShelter < 0) {
        netShelter = Math.abs(totalShelter);
        let lostPops = 0;
        if (netShelter <= 5) {
            lostPops = Math.floor(Math.random() * 4) + 1;
            yearEndPopulation -= lostPops;
        } else if (netShelter <= 10) {
            lostPops = Math.floor(Math.random() * 8) + 1;
            yearEndPopulation -= lostPops;
        } else if (netShelter <= 15) {
            lostPops = Math.floor(Math.random() * 12) + 1;
            yearEndPopulation -= lostPops;
        } else {
            lostPops = Math.floor(Math.random() * 20) + 1;
            yearEndPopulation -= lostPops;
        }
        document.getElementById("shelterEffects").textContent = "You lack "+netShelter+" shelters, and as a result lost: "+lostPops+" people!";
    } else {
        // everyone has proper shelter
        document.getElementById("shelterEffects").textContent = "Everyone has a shelter so no deaths.";
    }
    // defense roll, do something if defense not 100%
    // for now, there's a 20% chance of an attack that can remove 10*(1 - defense rating) (make 0 if negative killed)
    // TODO, USE THEIR COLONY NAME AS MUCH AS POSSIBLE NOT JUST "your colony"
    let attackRoll = Math.random();
    if (attackRoll < 0.2) {
        // TODO do something bad
        let popsKilled = Math.max(0, 10*(1 - totalDefense));
        yearEndPopulation-=popsKilled;
        document.getElementById("defenseRoll").textContent = colonyName+" was attacked! With a Defense of "+(totalDefense*100)+"%, "
        +"you lost: "+popsKilled+" Population!";
    } else {
        document.getElementById("defenseRoll").textContent = colonyName+" was not attacked this year.";
    }
    yearEndPopulation += newArrivals;  // newArrivals do not immediately consume resources
    document.getElementById("finalPopulation").textContent = "With " +newArrivals+" new colonists, Your final Population is: "+yearEndPopulation+"! (new people arrive at very end of year)";
    let finalScore = totalFood + totalEquipment + totalShelter + 100;
    // if population goes to or below 0, game over
    if (yearEndPopulation <= 0) {
        // TODO DO NOT ENABLE BUTTOM IF GAME OVER! just show final score
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").textContent = "All your colonists have died! "+colonyName + " is now an empty ghost town... GAME OVER! "+
            "Final Score= "+finalScore+ " Points!";
        document.getElementById("startNextYearButton").disabled = true;
    }
    // reached final year (after 1619 you reached goal of 1920)
    if (currentYear === 1619) {
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").textContent = "After 14 brutal years, your colony of "+colonyName
            +" has survived until 1620 after all odds. Your Final Score is: " +finalScore+"!";
        document.getElementById("startNextYearButton").disabled = true;
    }
    updateResources();
}

function updateResources() {
    // if any resource is below 0, set to 0. (can't have -shelter, lol)
    if (totalFood < 0) {
        totalFood = 0;
    }
    if (totalEquipment < 0) {
        totalEquipment = 0;
    }
    if (totalShelter < 0) {
        totalShelter = 0;
    }
    // update data
    let populationText = document.getElementById("currentPopulation");
    let foodText = document.getElementById("currentFood");
    let equipmentText = document.getElementById("currentEquipment");
    let shelterText = document.getElementById("currentShelter");
    let defenseText = document.getElementById("currentDefense");
    populationText.textContent = "Population: " + yearEndPopulation;
    foodText.textContent = "Food: " + totalFood;
    equipmentText.textContent = "Equipment: " + totalEquipment;
    shelterText.textContent = "Shelter: " + totalShelter;
    // TODO defense shouldn't show at all until final results screen. it's confusing
    // ^- :wait i have 90% defense what??
    defenseText.textContent = "Defense: " + (totalDefense*100) + "%";
}

// update year count and reset everything
function startNextYear() {
    document.getElementById("yearResults").style.display = "none";
    // TODO update year
    currentYear++;

    // reset data
    newArrivals = 0;
    yearStartPopulation = yearEndPopulation;
    farmerModifier = 1;
    farmersInput = 0;
    huntersInput = 0;
    buildersInput = 0;
    guardsInput = 0;
    let currentYearText = document.getElementById("currentYear");
    currentYearText.textContent = "Anno Domini: " + currentYear;
    // changing text messes up style
    // currentYearText.style.backgroundColor = "lightblue";

    // // if any resource is below 0, set to 0. (can't have -shelter, lol)
    // if (totalFood < 0) {
    //     totalFood = 0;
    // }
    // if (totalEquipment < 0) {
    //     totalEquipment = 0;
    // }
    // if (totalShelter < 0) {
    //     totalShelter = 0;
    // }
    // // update data
    // let populationText = document.getElementById("currentPopulation");
    // let foodText = document.getElementById("currentFood");
    // let equipmentText = document.getElementById("currentEquipment");
    // let shelterText = document.getElementById("currentShelter");
    // let defenseText = document.getElementById("currentDefense");
    // populationText.textContent = "Population: " + yearStartPopulation;
    // foodText.textContent = "Food: " + totalFood;
    // equipmentText.textContent = "Equipment: " + totalEquipment;
    // shelterText.textContent = "Shelter: " + totalShelter;
    // // TODO defense shouldn't show at all until final results screen. it's confusing
    // // ^- :wait i have 90% defense what??
    // defenseText.textContent = "Defense: " + totalDefense + "%";


    // enable input
    if (learnedFarming) {
        let farmersInputText = document.getElementById("farmersInput");
        farmersInputText.disabled = false
        farmersInputText.value = 0;
    }
    let huntersInputText = document.getElementById("huntersInput");
    huntersInputText.disabled = false
    huntersInputText.value = 0;
    let buildersInputText = document.getElementById("buildersInput");
    buildersInputText.disabled = false
    buildersInputText.value = 0;
    let guardsInputText = document.getElementById("guardsInput");
    guardsInputText.disabled = false
    guardsInputText.value = 0;
    document.getElementById("confirmJobs").disabled = false;
}

// weighted random choice. nOutcomes is a integer, weights is array of weights
function weightedRandomChoice(nOutcomes, weights) {
  // finding cumulative weights
  // e.g.: weights = [0.1, 0.4, .95]
  // cumulativeWeights = [0.1, 0.5, 1.00]
  const cumulativeWeights = [];
  for (let i = 0; i < weights.length; i += 1) {
    // javascript is weird... || 0 for i = 0 case
    cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
  }

  // choose random number from 0 to sum of all weights (max cumulative weight)
  const randomNum = (cumulativeWeights[cumulativeWeights.length - 1]) * Math.random();

  // select first item whose cumulative weight is greater than randomnNum
  for (let i = 0; i < nOutcomes; i += 1) {
    if (cumulativeWeights[i] >= randomNum) {
      return i;
    }
  }
}


function displayErrorMessage(message) {
    let errorPopup = document.getElementById("errorPopup");
    errorPopup.style.display = "block";
    errorPopup.textContent = message;
}













