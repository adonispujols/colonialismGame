let colonyName = "Jamestown";
const GAME_START_POPULATION = 100;
const GAME_START_FOOD = 200;
const GAME_START_EQUIPMENT = 150;
const GAME_START_SHELTER = 104;
let BASE_FARMER_PRODUCTION = 0;
// snapshot of start of year population to not mess up consumption/production from events
// ^- population will consume based on end population (excluding new arrivals) but produce based on start (makes game easier)
// ^- avoids quick gameover scenarios
// ^- EXCLUDES NEW ARRIVALS (makes it easier so people have 1 year to accommodate the food needs of new colonists)
let yearEndPopulation = GAME_START_POPULATION;
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
// list of events
/**
    Each Event object has:
    weight - chance from 0 to 1 of happening (0.5 = 50%) <- don't need weight attribute if forced
    initialEffect - effect that happens before choices are offered
    options - list of effects user can choose
    image - image to display
*/
let eventList = [
    {
        weight: 0.25,
        initialEffect: {
            effect: function() {
                yearEndPopulation -= 25;
            },
            text: "Bad water poisons the townsfolk. -25 people"
        },
        options: [
        {
            effect: function() {},
            text: "Boil the water!."
        }
        ],
        image: "badWaters.jpg"
    },
    {
        weight: 0.15,
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
                text: "We need every person we can get. Spare him. (-10% Defense this year)"
            }
        ],
        image: "murderer.jpg"
    },
    {
        weight: .1,
        initialEffect: {
            effect: function() {
                yearEndPopulation -= 35;
            },
            text: "Disease kills 35 people."
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "plague.jpg"
    },
    {
        weight: .05,
        initialEffect: {
            effect: function() {
                totalEquipment -= 20;
            },
            text: "Wear and tear removes 20 equipment."
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "weartear.jpg"
    },
    {
        weight: 0.15,
        initialEffect: {
            effect: function() {
                if ((guardsInput * .03) < 0.5) {
                    yearEndPopulation -= 10;
                    totalEquipment -= 20;
                    totalFood -= 75;
                }
            },
            text: "Iroquois attack! If your defense score is lower than 50% this year…\n-10 people, -20 equipment, -75 food."
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "indian_attack.jpg"
    },
    {
        weight: .2,
        initialEffect: {
            effect: function() {
                totalShelter -= 150;
            },
            text: "A grand fire burned down several houses. You lost 150 shelter."
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
        weight: .1,
        initialEffect: {
            effect: function() {
                totalFood -= 80;
            },
            text: "Bad food shortage. -80 food."
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "foodShortage.jpg"
    },
    {
        weight: .1,
        initialEffect: {
            effect: function() {
                farmerModifier *= 0.5;
            },
            text: "Blight: Food produced from farmers this year is cut in half"
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "plague.jpg"
    },
    {
        weight: 0.05,
        initialEffect: {
            effect: function() {
                console.log("fire happening");
                yearEndPopulation = Math.ceil(yearEndPopulation * 0.5);
                totalShelter = Math.ceil(totalShelter * 0.5);
            },
            text: "Storm: Lose half of total shelter, Lose half of total people"
        },
        options: [
        {
            effect: function() {},
            text: "We will survive."
        }
        ],
        image: "fireEvent.jpg"
    },
];

// learn farming
let event1608 = {
    initialEffect: {
        effect: function() {
            console.log("farming happening");
        },
        text: "A messenger from the Powhatan Tribe approaches! Do you…\n Accept his help: Set your farming skill level to 2 but Lose 30 equipment in trade.\n OR Capture him and raid his people. Set your farming skill level to 1, Gain 50 food, and Gain 1 Person"
    },
    options: [
    {
        effect: function() {
            learnedFarming = true;
            BASE_FARMER_PRODUCTION = 2;
            totalEquipment -= 30;
        },
        text: "Be peaceful and work together."
    },
    {
        effect: function() {
            learnedFarming = true;
            BASE_FARMER_PRODUCTION = 1;
            totalFood += 50;
            newArrivals += 1;
        },
        text: "Attack Natives!."
    }
    ],
    image: "learnFarmingEvent.jpg"
};

let event1606 = {
    initialEffect: {
        effect: function() {
            totalShelter -= 104;
        },
        text: "The boat you arrived in has returned home to England. - 104 shelter."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "arrivalNoFood.jpg"
};

let event1607 = {
    initialEffect: {
        effect: function() {
            yearEndPopulation -= 30;
            totalFood += 50;
            totalEquipment += 15;
        },
        text: "Disease Outbreak! -30 people.\nGift from local Native Tribe. +50 food, +15 equipment"
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "plague.jpg"
};

let event1609 = {
    initialEffect: {
        effect: function() {
        },
        text: "War declared with the Iroquois Federation! They may attack in the future…."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "indian_attack.jpg"
};
let event1610 = {
    initialEffect: {
        effect: function() {
            newArrivals += 150;
        },
        text: "Late arrivals to the colony finally arrived after being shipwrecked in Bermuda!. +150 population"
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "arrivalNoFood.jpg"
};

let event1611 = {
    initialEffect: {
        effect: function() {
            newArrivals += 100;
            totalFood += 100;
            totalEquipment +=100;
        },
        text: "Crops eaten by wild animals! Harvest reduced to 25%.\nMore colonists arrive from England! +100 people, +100 food, +100 equipment."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "arrivalWithFood.jpg"
};
let event1612 = {
    initialEffect: {
        effect: function() {
        },
        text: "Tobacco farming has taken off in the colony! What will you trade the tobacco for?\nAdd 200 food.\nOR add 100 equipment."
    },
    options: [
    {
        effect: function() {
            totalFood += 200;
        },
        text: "Add 200 Food."
    },
    {
        effect: function() {
            totalEquipment += 100;
        },
        text: "Add 100 Equipment"
    }
    ],
    image: "tradeEvent.jpg"
};

let event1613 = {
    initialEffect: {
        effect: function() {
            if ((guardsInput * .03) < 0.5) {
                yearEndPopulation -= 100;
                totalShelter -= 100;
                totalEquipment -= 30;
            }
        },
        text: "Iroquois attack! If your defense score is lower than 50% this year…\n-100 people, -100 shelter, -30 equipment."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "indian_attack.jpg"
};
let event1614 = {
    initialEffect: {
        effect: function() {
            if ((guardsInput * .03) < 0.5) {
                yearEndPopulation -= 20;
                totalFood -= 100;
                totalEquipment -= 40;
            }
        },
        text: "Iroquois attack continues! If your defense score is lower than 60% this year…\n-20 people, -100 food, -40 equipment."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "indian_attack.jpg"
};
let event1615 = {
    initialEffect: {
        effect: function() {
            newArrivals += 150;
            totalFood += 50;
            totalEquipment += 80;
        },
        text: "More colonists arrive from England!+150 people, +50 food, +80 equipment."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "arrivalWithFood.jpg"
};
let event1616 = {
    initialEffect: {
        effect: function() {
            totalFood -= 100;
        },
        text: "Your food storehouse was accidentally burned down!  -lose 100 food."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "fireEvent.jpg"
};
let event1617 = {
    initialEffect: {
        effect: function() {
            yearEndPopulation -=80;
        },
        text: "A harsh winter causes death due to exposure!  -lose 80 people."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "winter.jpg"
};
let event1618 = {
    initialEffect: {
        effect: function() {
            if ((guardsInput * .03) < 0.75) {
                yearEndPopulation -= 20;
                totalFood -= 100;
                totalEquipment -= 40;
            }
        },
        text: "Iroquois attack continues!  If your defense score is lower than 75% this year…  -Lose 20 people -Lose 100 food -Lose 40 equipment "
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "indian_attack.jpg"
};
let event1619 = {
    initialEffect: {
        effect: function() {
            newArrivals += 100;
        },
        text: "The Atlantic Slave Trade has begun in your colony. +100 people."
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "slavery.jpg"
};
let event1620 = {
    initialEffect: {
        effect: function() {
            newArrivals += 100;
        },
        text: "Final year for your colony!"
    },
    options: [
    {
        effect: function() {},
        text: "Continue"
    }
    ],
    image: "finalPic.jpg"
};

let flagFile = document.getElementById("flagFile");
let flagPreviewTitle = document.getElementById("flagPreviewTitle");
let flagPreviewGame = document.getElementById("flagPreviewGame");

flagFile.addEventListener("change", function() {
  showImage(this);
});

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
function loadGame() {
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
        displayErrorMessage("Error: Every box must be filled with a number (type 0 if none)!");
    } else if (rawFarmersInput < 0 || rawHuntersInput < 0 || rawBuildersInput < 0 || rawGuardsInput < 0) {
        displayErrorMessage("Error: Cannot assign negative jobs!");
    } else {
        // valid integer
        farmersInput = rawFarmersInput;
        huntersInput = rawHuntersInput;
        buildersInput = rawBuildersInput;
        guardsInput = rawGuardsInput;
        const jobsAssigned = farmersInput+huntersInput+buildersInput+guardsInput;
        if (jobsAssigned > yearEndPopulation) {
            displayErrorMessage("Assigned more jobs than people. Remove "+(jobsAssigned - yearEndPopulation)+" jobs.");
        } else if (jobsAssigned > totalEquipment) {
            displayErrorMessage("Assigned more jobs than equipment. Remove "+(jobsAssigned - totalEquipment)+ " jobs.");
        } else if ((jobsAssigned < yearEndPopulation) && (jobsAssigned < totalEquipment)) {
            // recommend to add mininum between equipment available for jobs or remaining population-
            //   -whichever one is a limiting factor
            displayErrorMessage("Assigned less jobs than people. Add "
                +Math.min(yearEndPopulation - jobsAssigned, totalEquipment - jobsAssigned)+" more jobs.");
        } else {
            // input is validated so we can move on to next step.
            // calculating and showing defense so far to help calculations
            totalDefense = guardsInput * .03;
            document.getElementById("currentDefense").textContent = "Defense: " + (totalDefense*100) + "%";
            console.log("inputs: "+farmersInput+", "+huntersInput+", "+buildersInput+", "+guardsInput);
            rollEvent();
        }
    }
}

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

    // hard coded events first THEN random events
    let chosenEvent = {};
    if (currentYear === 1606) {
        chosenEvent = event1606;
    } else if (currentYear === 1607) {
        chosenEvent = event1607;
    } else if (currentYear === 1608) {
        chosenEvent = event1608;
    } else if (currentYear === 1609) {
        chosenEvent = event1609;
    } else if (currentYear === 1610) {
        chosenEvent = event1610;
    } else if (currentYear === 1611) {
        chosenEvent = event1611;
    } else if (currentYear === 1612) {
        chosenEvent = event1612;
    } else if (currentYear === 1613) {
        chosenEvent = event1613;
    } else if (currentYear === 1614) {
        chosenEvent = event1614;
    } else if (currentYear === 1615) {
        chosenEvent = event1615;
    } else if (currentYear === 1616) {
        chosenEvent = event1616;
    } else if (currentYear === 1617) {
        chosenEvent = event1617;
    } else if (currentYear === 1618) {
        chosenEvent = event1618;
    } else if (currentYear === 1619) {
        chosenEvent = event1619;
    }  else if (currentYear === 1620) {
        chosenEvent = event1620;
    }

    document.getElementById("eventImage").src = chosenEvent.image;
    document.getElementById("eventText").textContent = chosenEvent.initialEffect.text;
    for (let i = 0; i < chosenEvent.options.length; i++) {
        let optionButton = document.getElementById("endEventButton" + (i+1));
        optionButton.style.display = "block";
        optionButton.value = chosenEvent.options[i].text;
        // wrapping function so event always moves forwards and updates
        optionButton.onclick = function() {
            chosenEvent.options[i].effect();
            // updating here not a big deal since it gets overwritten by 2nd event initial updates anuwaus.
            updateResources();
            document.getElementById("endEventButton1").style.display = "none";
            document.getElementById("endEventButton2").style.display = "none";;
            document.getElementById("endEventButton3").style.display = "none";;

            // random choice event
            let eventWeights = [];
            for (const eventItem of eventList) {
                eventWeights.push(eventItem.weight);
            }
            const eventRoll = weightedRandomChoice(eventList.length, eventWeights);
            let chosenRandomEvent = eventList[eventRoll];
            console.log("event roll: " + eventRoll);
            document.getElementById("eventImage").src = chosenRandomEvent.image;
            document.getElementById("eventText").textContent = chosenRandomEvent.initialEffect.text;
            for (let j = 0; j < chosenRandomEvent.options.length; j++){
                let randomoptionButton = document.getElementById("endEventButton" + (j+1));
                randomoptionButton.style.display = "block";
                randomoptionButton.value = chosenRandomEvent.options[j].text;
                randomoptionButton.onclick = function() {
                    chosenRandomEvent.options[j].effect();
                    updateResources();
                    endRolls();
                }
            }
            chosenRandomEvent.initialEffect.effect();
            updateResources();  // makes effects of main event button not show
        }
    }
    // show and execute effect of events (starting from 0)
    chosenEvent.initialEffect.effect();
    updateResources();
}

// close event dialog, show harvest/hunter and other roll results
function endRolls() {
    // document.getElementById("endEventButton").style.display = "none";
    document.getElementById("eventDialog").style.display = "none";
    document.getElementById("yearResults").style.display = "block";
    document.getElementById("gameOver").style.display = "none";

    // calculate rolls
    let harvestModifier = 0;
    if (currentYear === 1609) {
        harvestModifier = 0.5;
    } else if (currentYear === 1610) {
        harvestModifier = 1;
    } else if (currentYear === 1611) {
        harvestModifier = 0.25;
    } else if (currentYear === 1612) {
        harvestModifier = 1;
    } else if (currentYear === 1613) {
        harvestModifier = 0.75;
    } else if (currentYear === 1614) {
        harvestModifier = 1;
    } else if (currentYear === 1615) {
        harvestModifier = 1;
    } else if (currentYear === 1616) {
        harvestModifier = 1;
    } else if (currentYear === 1617) {
        harvestModifier = 0.5;
    } else if (currentYear === 1618) {
        harvestModifier = 1;
    } else if (currentYear === 1619) {
        harvestModifier = 1;
    } else if (currentYear === 1620){
        harvestModifier = 1;
    }
    // even-chance hunter rolls. 1/3rd chance for 0, 1, or 2 food
    const hunterRoll = Math.floor(Math.random() * 3);

    // calculate production, then consume, and negative effects calculated for deficit
    // food production
    let producedFarmerFood = Math.round(farmersInput * farmerModifier * harvestModifier* BASE_FARMER_PRODUCTION);
    let producedHunterFood = huntersInput * hunterRoll;
    let producedSumFood = producedFarmerFood + producedHunterFood;
    let producedShelter = buildersInput * 5;  // shelter from builders
    document.getElementById("farmerRoll").textContent = "Farmer Level: " +BASE_FARMER_PRODUCTION+ ",Harvest Modifier: "+harvestModifier+",Event Modifiers: " +farmerModifier +". Farmers Produced Total: "+producedFarmerFood + " Food.";
    document.getElementById("hunterRoll").textContent = "Hunter Roll: " + hunterRoll +
        ". Hunters produced: " + producedHunterFood + " Food";

    // add production to stockpile then consume
    totalFood += producedSumFood;
    totalShelter += producedShelter;
    // consume resources, then apply negative effects (if applicable)
    totalFood -= yearEndPopulation;
    document.getElementById("netFood").textContent = "Total food produced= "+producedSumFood + " Food."
        +" Food consumed= " + yearEndPopulation + " Food. Net: " +(producedSumFood- yearEndPopulation) + " Food.";
    // if not enough food for each person, reduce population by difference
    if (totalFood < 0) {
        yearEndPopulation += Math.ceil(totalFood); // total food would be negative
        document.getElementById("foodEffects").textContent = "Not enough food, " + totalFood + " people died of hunger!";
    } else {
        // enough food for all
        document.getElementById("foodEffects").textContent = "Enough food for everyone this year. No hunger.";
    }
    document.getElementById("shelterProduction").textContent = "Builders produced: " + producedShelter;
    // more shelter losses increases amount of deaths (random roll)
    let netShelter = totalShelter - yearEndPopulation;
    if (netShelter < 0) {
        netShelter = Math.abs(netShelter);
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
        document.getElementById("shelterEffects").textContent = "You lack "+(Math.ceil(netShelter))+" shelters, and as a result lost: "+lostPops+" people!";
    } else {
        // everyone has proper shelter
        document.getElementById("shelterEffects").textContent = "Everyone has a home so no deaths from lack of shelter.";
    }


    yearEndPopulation += newArrivals;  // newArrivals do not immediately consume resources
    document.getElementById("finalPopulation").textContent = "With " +newArrivals+" new colonists, Your final Population is: "+yearEndPopulation+"! (new people arrive at very end of year)";
    newArrivals = 0; // update for next years population count
    let finalScore = totalFood + totalEquipment + totalShelter + 100;
    // if population goes to or below 0, game over
    if (yearEndPopulation <= 0) {
        // TODO DO NOT ENABLE BUTTOM IF GAME OVER! just show final score
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").textContent = "GAME OVER!\n All your colonists have died! "+colonyName + " is now an empty ghost town..."+
            "Final Score= "+finalScore+ " Points!";
        document.getElementById("startNextYearButton").disabled = true;
    }
    // reached final year (after 1619 you reached goal of 1920)
    if (currentYear === 1620) {
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").textContent = "GAME OVER!\n After 14 brutal years, your colony of "+colonyName
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
    populationText.textContent = "Population: " + (yearEndPopulation + newArrivals);
    foodText.textContent = "Food: " + totalFood;
    equipmentText.textContent = "Equipment: " + totalEquipment;
    shelterText.textContent = "Shelter: " + totalShelter;
    defenseText.textContent = "Defense: " + (totalDefense*100) + "%";
}

// update year count and reset everything
function startNextYear() {
    document.getElementById("yearResults").style.display = "none";
    currentYear++;

    // reset data
    newArrivals = 0;
    // yearStartPopulation = yearEndPopulation;
    farmerModifier = 1;
    farmersInput = 0;
    huntersInput = 0;
    buildersInput = 0;
    guardsInput = 0;
    let currentYearText = document.getElementById("currentYear");
    currentYearText.textContent = "Anno Domini: " + currentYear;

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
    document.getElementById("currentDefense").textContent = "Defense: 0%"; // reset defense for simplicity
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
