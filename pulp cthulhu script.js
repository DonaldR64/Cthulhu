//Pulp Cthulhu

var CthulhuScript = CthulhuScript || {}

on ("chat:message", function(msg) {
	if (msg.type != "api") {
		return
	}

	var command = msg.content.split(" ",1)
	if (command == "!Cthulhu") {
		CthulhuScript.Process(msg)
	}

})


CthulhuScript.Process = function(msg) {

//Variables
	var Tag = msg.content.split(" ")
	var Action = Tag[1] //Ranged, Melee, Maneuvre, Dodge
	var luckBackground = "https://i.imgur.com/ODC17DZ.png"
	var turnorder = (Campaign().get('turnorder')) ? JSON.parse(Campaign().get('turnorder')) : []
	var characterTokenID = Tag[2]

	if (!characterTokenID) {
			chars = turnorder.length
		if (chars < 1) {return}
		characterTokenID = turnorder[0].id
	}

	var characterToken = findObjs({_type: "graphic", id: characterTokenID})[0]
	var characterName = characterToken.get("name")
	var character = getObj("character",characterToken.get("represents"))
	var characterLuck = Number(Attribute(character,"luck"))
	var characterType = Attribute(character,"type") //use to designate allies for purposes of tracking ammo etc.
	if (characterType == "ally" || characterType == "player") {characterType = "PC"}
	if (characterType != "PC") {characterType = "enemy"}	

	var playerID = character.get('controlledby')
	var playerID = playerID.split(",")[0]
	if (playerID != "") {characterType = "PC"}
	if (playerID == ""){playerID = "-MdSb7lpNgu5webjIuab"} //change to appropriate GM id

	var page = getObj('page',characterToken.get('pageid'));
	var scale = page.get('scale_number') // map scale in metres	or yards

	// Array of Objects on Page
	const currentPageGraphics = findObjs({
		_pageid: Campaign().get("playerpageid"),
		_type: "graphic",
		_subtype: "token",
		layer: "objects",
	})

	const gmArray = findObjs({
    	_pageid: Campaign().get("playerpageid"),
    	_type: "graphic",
   		_subtype: "token",
    	layer: "gmlayer",
	})

	var cpgLength = currentPageGraphics.length

	var click = findObjs({type: "jukeboxtrack", title: "Click"})[0]

	if (!state.PulpCthulhu) {state.PulpCthulhu = ""}

//Templates

	var luckImage = "https://i.imgur.com/ODC17DZ.png"

	var powerCardTemplate = "!power {{ --bgcolor|#000000 --txcolor|#C7FF33 --titlefont|Columbus --subtitlefont|Columbus --titlefontshadow|none --corners|10 --border|5px ridge #C7FF33 --orowbg|#FFFFFF --erowbg|#DAF7AA --bodyfont|Columbus --emotefont|font-family: Columbus; font-weight:bold; font-style:Italic; font-size: 16px; --charid| <<SUBJECTID>> --name|<<SUBJECTNAME>> --emote|<<EMOTE>> <<LEFTSUB>> <<RIGHTSUB>>"

	var tokenTemplate = " --tokenid|<<SUBJECTTOK>> --target_list|<<TARGETTOK>>" //used if want pics of tokens in output

	var luckButton = " --!LUCKBUTTON|~~~" + '<a href="<<LUCK>>" style="background-image:url('+luckImage+'); border:0px; background-repeat:no-repeat; background-size:100% 100%; background-color:transparent; background-position:right; color:black; padding: 10px 20px 10px 40px">Use Luck? (<<FINAL>>/<<SHOOTER>>)</a>'


//Common Functions

function Test(stat,extraDice,bracket,ranged) { //stat is eg. Brawl, bracket is target eg Regular, Hard, extraDice is negative or positive or zero
	//roll #s and keep lowest/highest based on extraDice
	let tens1 = Number((randomInteger(10) - 1) * 10) //-1 to give a # between 0 and 9
	let tens2 = Number((randomInteger(10) - 1) * 10)
	let tens3 = Number((randomInteger(10) - 1) * 10)
	let ones = Number(randomInteger(10)) // will add to the tens, so 100 = 90 + 10
	if (!extraDice || extraDice == 0) {roll = Number(tens1 + ones)}
	if (extraDice == 1) {roll = Number(Math.min(tens1,tens2) + ones)}
	if (extraDice == 2) {roll = Number(Math.min(tens1,tens2,tens3) + ones)}	
	if (extraDice == -1) {roll = Number(Math.max(tens1,tens2) + ones)}
	if (extraDice == -2) {roll = Number(Math.max(tens1,tens2,tens3) + ones)}
	//part 3 - determine success or failure based on difficulty level/bracket
	let level = 0
	if (!bracket) {//default is Regular difficulty
		bracket = 1
	} 
	if (!ranged) {ranged = false}
	luck = 0

	if (bracket==1) { //Regular
		if (roll <= stat) {
			result = "Regular Success"
			level = 1
		}
		if (roll <= Math.floor(stat/2)) {
			result = "Hard Success"
			level = 2
		}
		if (roll <= Math.floor(stat/5)) {
			result = "Extreme Success"
			level = 3
		}
		if (roll == 1) {
			result = "Critical Success"
			level = 4
		}
		if (roll > stat) {
			result = "Failure"
			luck = Number(roll-stat)
		}
	}

	if (bracket == 2) { //Hard
		need = Math.floor(stat/2)
		if (roll <= need) {
			result = "Hard Success"
			level = 2
		} else if (roll <= Math.floor(stat/5)) {
			result = "Extreme Success"
			level = 3
		} else if (roll == 1) {
			result = "Critical Success"
			level = 4
		} else {
			result = "Failure"
			luck = Number(roll - need)
		}
	}

	if (bracket == 3) { //Extreme
		need = Math.floor(stat/5)
		if (roll <= need) {
			result = "Extreme Success"
			level = 3
		} else if (roll == 1) {
			result = "Critical Success"
			level = 4
		} else {
			result = "Failure"	
			luck = Number(roll - need)
		}
	}
	if (ranged == true && result == "Extreme Success") { //Possible Impale
		result = "Extreme Hit"
	}
	if (ranged == true && result == "Critical Success") {
		result = "Critical Hit"
	}
	if (ranged == true && (result == "Regular Success" || result == "Hard Success")) {
		result = "Regular Hit"
	}

	if (ranged == false) {
		luck1 = Math.max(Number(roll-stat),0)
		luck2 = Math.max(Number(roll-(Math.floor(stat/2))),0)
		luck3 = Math.max(Number(roll-(Math.floor(stat/5))),0)
		luck4 = Number(roll-1)
		luck = [luck1,luck2,luck3,luck4]
	}


	if ((stat < 50 && roll > 95) || roll == 100) {
		result = "Fumble"
		level = -1
		luck = 10
	}
	if (roll == 100) {
		result = "Fumble"
		level = -1
		luck = 10
	}



	endresult = [roll,result,luck,level]
	return endresult
}

function LuckAdjust(token,luck) {
	luck = Number(luck)
	character = getObj("character",token.get("represents"))
	initialLuck = Number(Attribute(character,"luck"))
	newLuck = initialLuck - luck 
	AttributeSet(character,"luck",newLuck)
	return newLuck
}

//checks to see if wall in way and then stops it if there is, returns x,y of point
function TargetIntersection(originLeft,originTop,destLeft,destTop) {
    // Returns an array of all paths on the dynamic lighting layer
    const findWalls = function (pageid) {
        wallArray = findObjs({
        layer: 'walls',
        _type: 'path',
        _pageid: pageid,
        });
        // This is to make the array nice and find out where the points actually are
        var completePointArray = _.map(wallArray, function (wall) {
        const pathTuple = JSON.parse(wall.get('path'));
        const transformInfo = PathMath.getTransformInfo(wall);
        const pointArray = _.map(pathTuple, (tuple => PathMath.tupleToPoint(tuple, transformInfo)));
        return pointArray;
        })
      return completePointArray;
    };
   

    const checkCollision = function (pathToMove, walls) {
      if (!walls) return pathToMove[1];
      const intersect = getCollisionPoint(pathToMove, walls);
      if (intersect) {
        const obj1 = pathToMove[0];
        const obj2 = intersect[0];
        const d_x = obj2[0] - obj1[0];
        const d_y = obj2[1] - obj1[1];
        let distance = Math.sqrt((d_x * d_x) + (d_y * d_y));
        if (distance <= 30) return pathToMove[0];
        distance -= 30;
        const theta = Math.atan2(d_y, d_x);
        const new_d_x = Math.cos(theta) * distance;
        const new_d_y = Math.sin(theta) * distance;
        const new_x = obj1[0] + new_d_x;
        const new_y = obj1[1] + new_d_y;
        return [new_x, new_y];
      } else {
        return pathToMove[1];
      }
    };

    const getCollisionPoint = function (pathToMove, walls) {
      const intersectArray = [];
      _.each(walls, function (wall) {
        for (var a = 0; a < wall.length - 1; a++) {
          const intersect = PathMath.segmentIntersection(pathToMove, [wall[a], wall[a + 1]]);
          if (intersect) intersectArray.push(intersect);
        }
      });
      const closestIntersect = _.chain(intersectArray).sortBy(value => value[1]).first().value()
      return closestIntersect;
    };

	var walls = findWalls(Campaign().get("playerpageid"));

    // Check intersection with walls here
    const movement_vector = checkCollision([[originLeft, originTop, 1], [destLeft, destTop, 1]], walls);
  	var new_x = movement_vector[0];
 	var new_y = movement_vector[1];
 	if (new_x == destLeft && new_y == destTop) {
 		return true
 	} else {
 		return [new_x,new_y]
 	}
}


function FirearmTest(stat,bracket,extraDice) { //stat is eg. Dex, bracket is target eg Regular, Hard, extraDice is negative or positive or zero
	//roll #s and keep lowest/highest based on extraDice
	let tens1 = Number((randomInteger(10) - 1) * 10) //-1 to give a # between 0 and 9
	let tens2 = Number((randomInteger(10) - 1) * 10)
	let tens3 = Number((randomInteger(10) - 1) * 10)
	let ones = Number(randomInteger(10)) // will add to the tens, so 100 = 90 + 10
log (tens1 + ";" + tens2 + ";" + tens3 + "//" + ones)

	if (extraDice == 0) {roll = Number(tens1 + ones)}
	if (extraDice == 1) {roll = Number(Math.min(tens1,tens2) + ones)}
	if (extraDice == 2) {roll = Number(Math.min(tens1,tens2,tens3) + ones)}	
	if (extraDice == -1) {roll = Number(Math.max(tens1,tens2) + ones)}
	if (extraDice == -2) {roll = Number(Math.max(tens1,tens2,tens3) + ones)}
	//part 3 - determine success or failure based on difficulty level/bracket
	let result = "Miss"
	luck = 0
	if (stat < 50 && roll > 95) {
		result = "Fumble"
		luck = 10
	}
	if (roll == 100) {
		result = "Fumble"
		luck = 10
	}

	if (bracket == 1) { //Regular
		if (roll <= stat) { 
			result = "Hit"
		} else {
			luck = Number(roll-stat)
		}
	}
	if (bracket == 2) { //Hard
		need = Math.floor(stat/2)
		if (roll <= need) {
			result = "Hit"
		} else {
			luck = Number(roll - need)
		}
	}
	if (bracket == 3) { //Extreme
		need = Math.floor(stat/5)
		if (roll <= need) {
			result = "Hit"
		} else {
			luck = Number(roll - need)
		}
	}
	if ((bracket == 1 || bracket == 2) && roll <= Math.floor(stat/5)) { //Possible Impale
		result = "Extreme Hit"
	}
	if (roll == 1) {
		result = "Critical Hit"
	}

	endresult = [roll,result,luck]
	return endresult
}

//Distance
function Distance(token1,token2,scale) {
	var originLeft = Math.round(token1.get("left"))
	var originTop = Math.round(token1.get("top"))
	var destLeft = Math.round(token2.get("left"))
	var destTop = Math.round(token2.get("top"))
	var x = originLeft - destLeft
	var y = originTop - destTop
	var distance = Math.sqrt(x*x + y*y)
	distance = Math.round(distance/70)*scale
	return [distance]
}

function DistancePoints(originLeft,originTop,destLeft,destTop,scale) {
	var x = originLeft - destLeft
	var y = originTop - destTop
	var distance = Math.sqrt(x*x + y*y)
	distance = Math.round(distance/70)*scale
	return [distance]
}

//Rotate Point Function
//cx, cy = coordinates of the center of rotation
//angle = clockwise rotation angle
//p = point object
function RotatePoint(cX,cY,angle, p){
	angle *= Math.PI/180
    s = Math.sin(angle);
    c = Math.cos(angle);

    // translate point back to origin:
    p.x -= cX;
    p.y -= cY;

    // rotate point
    newX = p.x * c - p.y * s;
    newY = p.x * s + p.y * c;

    // translate point back:
    p.x = Math.round(newX + cX);
    p.y = Math.round(newY + cY);
    return p;
}

// to see if firing line crosses cover.  A is generally firer's pt, B is targets pt, rectangle is an object with 4 points within
function RectangleIntersection(A,B,rectangle) { 
	IntersectA = SegmentIntersection(A,B,rectangle.p0,rectangle.p1)
	if (IntersectA == true) {return true}
	IntersectB = SegmentIntersection(A,B,rectangle.p1,rectangle.p2)
	if (IntersectB == true) {return true}
	IntersectC = SegmentIntersection(A,B,rectangle.p2,rectangle.p3)
	if (IntersectC == true) {return true}
	IntersectD = SegmentIntersection(A,B,rectangle.p3,rectangle.p0)
	if (IntersectD == true) {return true}
	return false
}

//p0 and p1 from 1st line segment, p2 and p3 from 2nd line segment
//all supplied with x,y
//false if no intersection

function SegmentIntersection(p0, p1, p2, p3) {
    let s, s1_x, s1_y, s2_x, s2_y, t;
    let denom;
    
    s1_x = p1.x - p0.x;
    s1_y = p1.y - p0.y;
    s2_x = p3.x - p2.x;
    s2_y = p3.y - p2.y;

    s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);
    
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return true
        /*
        return {
            x: p0.x + (t * s1_x),
            y: p0.y + (t * s1_y)
        };
        */
    }
    return false;
};


function Damage(number,sides,bonus,hitType,impale,targetArmour,meleeDB) {
	shotDamage = damageBonus = 0
	for (dice=0;dice<number;dice++) {
		if (hitType == "Extreme" || hitType == "Critical") {
			dmg = sides
		} else if (hitType == "Normal") {
			dmg = Number(randomInteger(sides))
		}
		shotDamage += dmg
		shotDamage -= targetArmour //armour taken off each dice roll
	}
	if (meleeDB && meleeDB != 0) {
		if (meleeDB.includes("d") == false) {
			damageBonus += Number(meleeDB)
		} else {
			db = meleeDB.split("d")
			dbNum = Number(db[0])
			dbSides = Number(db[1])
			for (dbDice = 0;dbDice<dbNum;dbDice++) {
				if (hitType == "Extreme" || hitType == "Critical") {
					damageBonus += dbSides
				} else if (hitType == "Normal") {
					damageBonus += Number(randomInteger(sides))
				}	
			}
		}
	}
	if ((impale == true && hitType == "Extreme") || (impale == false && hitType == "Critical")) {
		shotDamage += Number(randomInteger(sides))
	}
	if (impale == true && hitType == "Critical") {
		shotDamage += sides + bonus
	}
	shotDamage += bonus
	shotDamage += damageBonus
	shotDamage = Math.max(0,shotDamage)
	return shotDamage
}

//Cover Check
function CoverCheck(shooterToken,targetToken,coverArray,scale) {
		var originPt = {
		x: shooterToken.get("left"),
		y: shooterToken.get("top")
	}

	var targetPt = {
		x: targetToken.get("left"),
		y: targetToken.get("top")
	}

	for (i=0;i<coverArray.length;i++) {
		token = coverArray[i].token
		crossedQ = RectangleIntersection(originPt,targetPt,coverArray[i])
		if (crossedQ == true) { // firing line crosses a cover object
			dist = Distance(token,targetToken,scale) 
			width = token.get("width")/140
			dist -= width
			if (dist > scale) {continue}
			return true
		}
	}
	return false
}

//Lethal Damage vs Damage
function LethalDamage(shooterToken,token,coverArray,scale,lethality) {
	roll10 = Number(randomInteger(10))
	roll1 = Number(randomInteger(10))
	roll = (roll10-1)*10 + roll1
	damage = roll10 + roll1

	lethalCover = CoverCheck(shooterToken,token,coverArray,scale)
	diveCover = token.get("status_bolt-shield")
	char = getObj("character",token.get("represents"))
	sizeCheck = Attribute(char,"build")
	//no lethal if behind cover, dove for cover or size 4+
	if (lethalCover == true || diveCover == true || sizeCheck >= 4) {roll = 100}

	if (roll <= lethality) {
		return "lethal"
	} else return damage
}


//Retrieve Values from Character Sheet Attributes
function Attribute(character,attributename) {
    let attributeobj = findObjs({type:'attribute',characterid: character.id, name: attributename})[0]
    let attributevalue = 0
    if (attributeobj) {
        attributevalue = attributeobj.get('current')
    }
    return attributevalue
}

function AttributeMax(character,attributename) {
	let attributeobj = findObjs({type:'attribute',characterid: character.id, name: attributename})[0]
    let attributevalue = 0
    if (attributeobj) {
        attributevalue = attributeobj.get('max')
    }
    return attributevalue
}



function Talent(character,attributename) {
	  let attributeobj = findObjs({type:'attribute',characterid: character.id, name: attributename})[0]
    let attributevalue = false
    if (attributeobj) {
        attributevalue = true
    }
    return attributevalue
}


function StatTest(stat) {
	let roll = Number(randomInteger(100))
	let result = "Failure"
	let lvl = 0
	if (stat < 50 && roll > 95) {result = "Fumble"; lvl = -1}
	if (roll == 100) {result = "Fumble" ; lvl = -1}
	if (roll <= stat) {result = "Regular Success" ; lvl = 1 }
	if (roll <= Math.floor(stat/2)) {result = "Hard Success" ; lvl = 2}
	if (roll <= Math.floor(stat/5)) {result = "Extreme Success" ; lvl = 3}
	if (roll == 1) {result = "Critical Success" ; lvl = 4} 
	endresult = [roll,result,lvl]
	return endresult
}

//Set Value on Atribute
function AttributeSet(character,attributename,newvalue) {
	let attributeobj = findObjs({type:'attribute',characterid: character.id, name: attributename})[0]
	if (attributeobj) {
		attributeobj.set("current",newvalue)
	} else {
	// create object and value is new value
		createObj("attribute", {
        name: attributename,
        current: newvalue,
        characterid: character.id
    	});
	}
	return "nil"
}




//create array of objects with "Cover" in name 
function CoverArray(cpg) {
	array = []
	for (let i=0;i<cpg.length;i++) {
		let token = cpg[i]
		let tokenChar = getObj("character",token.get("represents"))
		if (!tokenChar) {continue}
		let name = token.get("name")
		if (name.includes("Cover") == false) {continue}

		cX = token.get("left") //center of token
		cY = token.get("top")
		width = token.get("width")
		height = token.get("height")
		angle = token.get("rotation")
		//define the four corners
		p0 = { 
			x: (cX - width/2),
			y: (cY - height/2)
		}
		p1 = {
			x: (cX + width/2),
			y: (cY - height/2)
		}
		p2 = {
			x: (cX + width/2),
			y: (cY + height/2)
		}
		p3 = {
			x: (cX - width/2),
			y: (cY + height/2)
		}
		//rotate the points for the object
		obj = {
			id: token.id,
			char: tokenChar,
			token: token,
			p0: RotatePoint(cX,cY,angle,p0),
			p1: RotatePoint(cX,cY,angle,p1),
			p2: RotatePoint(cX,cY,angle,p2),
			p3: RotatePoint(cX,cY,angle,p3)
		}
		array.push(obj)
	}
	return array
} 


function SanityLoss(sanityNumber,result) { //SanityLoss(failSanity,"Fumble")
	//dissect sanityNumber
	if (sanityNumber.includes("d")) {
		sanityNumber = sanityNumber.split("d")
		sanityDice = Number(sanityNumber[0])
		if (sanityDice == "") {sanityDice = 1}
		sanitySides = Number(sanityNumber[1]) //eg 6 for d6
		if (result == "Fumble") {
			sanity = sanityDice * sanitySides
		} else {
			sanity = 0
			for (let j=0;j<sanityDice;j++) {
				sanity += Number(randomInteger(sanitySides))
			}
		}
	} else {
		sanity = Number(sanityNumber)
	}
	return sanity
}

function SKILL(char,skillname) { //character sheet doesnt define base #s for skills - needs to be expanded as add buttons
	switch(skillname) {
		case "Appraise" :
			attribute = "appraise"
			base = 5
			break;
		case "Charm" :
			attribute = "charm"
			base = 15
			break;
		case "Credit_Rating" :
			attribute = "credit_rating"
			base = 0
			break;
		case "Cthulhu_Mythos" :
			attribute = "cthulhu_mythos"
			base = 0	
			break;
		case "Drive" :
			attribute = "drive"
			base = 20
			break;
		case "Fast_Talk" :
			attribute = "fast_talk"
			base = 5
			break;
		case "First_Aid" :
			attribute = "first_aid"
			base = 30
			break;
		case "History" :
			attribute = "history"
			base = 5
			break;
		case "Intimidate" :
			attribute = "intimidate"
			base = 15
			break;
		case "Jump" :
			attribute = "jump"
			base = 20
			break;
		case "Library_Use" :
			attribute = "library_use"
			base = 20
			break;
		case "Locksmith" :
			attribute = "locksmith"
			base = 1
			break;
		case "Nat.World" :
			attribute = "natural_world"		
			base = 10
			break;
		case "Navigate" :
			attribute = "navigate"
			base = 10
			break;
		case "Occult" :
			attribute = "occult"
			base = 5
			break;
		case "Persuade" :
			attribute = "persuade"
			base = 10
			break;
		case "Stealth" :
			attribute = "stealth"
			base = 20
			break;
		case "Track" :
			attribute = "track"
			base = 10
			break;									
		case "Psychology" :
			attribute = "psychology"
			base = 10
			break;
		case "Spot_Hidden" :
			attribute = "spot_hidden"
			base = 25
			break;
		case "Listen" :
			attribute = "listen"
			base = 20
			break;	
		case "Luck" :
			attribute = "luck"
			base = 0
			break;	
		case "STR" :
			attribute = "strength"
			base = 0
			break;
		case "CON" :
			attribute = "constitution"
			base = 0
			break;
		case "SIZ" :
			attribute = "size"
			base = 0
			break;
		case "DEX" :
			attribute = "dexterity"
			base = 0
			break;
		case "APP" :
			attribute = "appearance"
			base = 0
			break;
		case "EDU" :
			attribute = "education"
			base = 0
			break;
		case "INT" :
			attribute = "intelligence"
			base = 0
			break;
		case "POW" :
			attribute = "power"
			base = 0
			break;						
		default: 
			base = 0
	}
	skill = Number(Attribute(char,attribute))
	if (skill == 0) {skill = base}
	return skill			
}


function MeleeDice(token1,token2,weapon,outnumber) {
		let extraDice = 0
		let bonusOut = ""
		let name1 = token1.get("name")
		let name2 = token2.get("name")
		let character1 = getObj("character",token1.get("represents"))
		let character2 = getObj("character",token2.get("represents"))
		let token1Build = Number(Attribute(character1,"build"))
		let outmaneuvre = Talent(character1,"outmaneuvre")
		if (outmaneuvre == true) {token1Build += 1}
		ignorebuild = Talent(character1,"ignorebuild")
		let token2Build = Number(Attribute(character2,"build"))
		let buildDifference = token1Build - token2Build
		if (ignorebuild == true) {buildDifference = 0}
		let weaponinfo = WeaponInfo(weapon)
		let weaponSpecial = weaponinfo.Special

		if (buildDifference < -2 && weaponSpecial.includes("Maneuvre")) {
			return [-100,"Unable to complete Maneuvre due to size Difference."]
		}	

		if (token1.get("status_yellow")==true) {//token has disadvantage
			extraDice -= 1
			bonusOut += "(-)Has Fumbled^^"
			token1.set("status_yellow",false) //applies only to next action so clear
		}

		if (token1.get("status_pink") == true) { //token has ongoing disadvantage
			extraDice -= 1
			bonusOut += "(-)Attacker Disadvantaged^^"
		}

		if (name2.includes("Polyp")) {
			if (token2.get("aura1_color") == "#000000") { //invisible, listen test to locate
				let listen = Number(Attribute(character1,"listen"));
				if (listen < 20) {listen = 20}	
				let listenTest = Test(listen,0,1,"");	
				if (listenTest[1].includes("Success") == false) {
					powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
					powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
					powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character1.id)	
					powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",name1)
					powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
					powerCardTemplate += " --!B|The character is unable to pinpoint the sound of the Polyp."
					sendChat("",powerCardTemplate)
					return
				} else {
					powerCardTemplate += " --!I|The character is able to guess the rough location of the Polyp through a successful Listen Test.";
					bonusOut += "(-)Target is Invisible^^";
					extraDice -= 1;
				}
			} else { //check luck to see if goes invisible
				let luck = Number(Attribute(character1,"luck"));
				let luckTest = Test(luck,0,1,"")
				if (luckTest[1].includes("Success") == false) {
					powerCardTemplate += " --!B|The Polyp fades into Invisibility just as the character attacks."
					bonusOut += "(-)Target is Invisible^^";
					extraDice -= 1;
					token2.set({
						aura1_color: "#000000",
						aura1_radius: 1,
					})
				} 
			}
		}
		
		if (token2.get("status_three-leaves")) { //cloak of fire
			extraDice -= 1
			bonusOut += "(-)Cloak of FIre^^"
		}		

		if (token1.get("status_green")==true) {//token has advantage from critical initiative or dodge
			extraDice += 1
			bonusOut += "(+)Has Advantage^^"
			token1.set("status_green",false)
		}
		if (token2.get("status_yellow")==true) { //token disadvantaged due to a fumble roll
			extraDice += 1
			bonusOut += "(+)Opponent Fumbled^^"
		}
		if (token2.get("status_back-pain")==true) { //token is prone
			extraDice += 1
			bonusOut += "(+)Opponent Prone^^"
		}



		if (token2.get("status_sleepy")==true || token2.get("status_interdiction") == true || token2.get("status_fishing-net") == true || token2.get("status_grab") == true) {//token is surprised, helpless, restrained or Grappled
			extraDice += 1
			bonusOut += "(+)Opponent Surprised/Helpless/Restrained^^"
		}
		if (outnumber == true) { //token is now subject to outnumber bonus
			extraDice += 1
			bonusOut += "(+)Opponent Outnumbered^^"
		}
		//manuevre bonuses/penalties
		if (weaponSpecial.includes("Maneuvre") && buildDifference < 0) {
			extraDice -= buildDifference
			bonusOut += "(" + buildDifference + ")Build Smaller^^"
		}

		if (weaponinfo.Name.includes("Akmallah")) {
			extraDice += 2
			bonusOut += "(++)Sword of Akmallah^^"
		}


		extraDice = Math.min(extraDice,2)
		extraDice = Math.max(extraDice,-2)
		if (bonusOut == "") {
			bonusOut = "No Bonus/Penalty Dice"
		} else {
			bonusOut = bonusOut.slice(0,-2)
		}
		return [extraDice,bonusOut]
}

function MeleeResult(character,weapon,eDice) {
	weaponInfo = WeaponInfo(weapon)
	weaponSkill = weaponInfo.Skill
	//skill
	if (weaponSkill != "brawl") { //fighting_skill_1_name
		for (let a=1;a<5;a++) { 
			skillName = "fighting_skill_"+a+"_name"
			skill = Attribute(character,skillName)
			if (skill == weaponSkill) {
				weaponSkill = "fighting_skill_" + a
				break
			}
		}
	}	
	characterSkill = Attribute(character,weaponSkill)
	results =  Test(characterSkill,eDice,1,false)
	if (results[3] > 0) {
		skillCheck = weaponSkill+"-check"
		AttributeSet(character,skillCheck,"on")
	}

	return results
}


function MeleeDamage(weaponinfo,result,token1,token2,whose) {
	weaponDamage = weaponinfo.Damage
	impale = weaponinfo.Impale

	character1 = getObj("character",token1.get("represents"))
	character2 = getObj("character",token2.get("represents"))

	if (weaponDamage.includes("DB")) {
		var meleeDB = Attribute(character1,"damage_bonus")
	} else var meleeDB = 0

	//wpnDamage broken down  eg 1d10+10
	var weaponDamage = weaponDamage.split("d")
	var numDice = Number(weaponDamage[0])
	var dicePart2 = weaponDamage[1]
	var dicePart2 = dicePart2.split("+")
	var diceSides = Number(dicePart2[0])
	var bonusToDice = Number(dicePart2[1])
	if (!bonusToDice) {bonusToDice = 0}

	armourText = Attribute(character2,"armor_value").toString()
	armour = Number(armourText.replace(/\D/g,''))
	if (isNaN(armour)) {armour = 0}
	altArmourText = Attribute(character2,"armor").toString()
	altArmour = Number(altArmourText.replace(/\D/g,''))	 //NPCs appear to have different titled value
	if (isNaN(altArmour)) {altArmour == 0}

	armour = Math.max(armour,altArmour)
	if (weaponinfo.Special.includes("magical")) {
		armour = 0
	}
	if (weaponinfo.Special.includes("Maneuvre")) {
		output = " --!A|" + token1.get("name") + " successfully completes his maneuvre."
	} else {
		if (whose == true) {
			back = ""
			if (result[3] == 4) { //critical damage
				damage = Damage(numDice,diceSides,bonusToDice,"Critical",impale,armour,meleeDB)
			} else if (result[3] == 3) { //extreme damage
				damage = Damage(numDice,diceSides,bonusToDice,"Extreme",impale,armour,meleeDB)
			} else { //normal damage
				damage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,armour,meleeDB)
			}
		} else { //normal damage - from defender
			back = "back"
			damage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,armour,meleeDB)
		}
		output = " --!A|" + token1.get("name") + " successfully hits " + back + " doing " + damage + " damage."
		output += DamageCheck(damage,character2,token2)
		output += DamageSpecial(weaponinfo.Special,character1,character2,token2)
	}	
	return output
}

function DamageSpecial(special,attackchar,targetchar,targettoken) { //for ongoing special effects of attacks
	specialText = ""
	if (special == "Fog") {
		specialText = " --!S|Tendrils insert into the victim's nose and mouth.^^Choking Damage is inflicted each round.^^To break free requires an opposed STR test vs STR 25 * # of Tendrils."
	}
	if (special == "Sandblast") {
		dex = Number(Attribute(targetchar,"dexterity"))
		spot = Number(SKILL(targetchar,"Spot_Hidden"))
		stat = Math.min(dex,spot)
		statTest = Test(stat,0,1,false)[1]
		if (statTest.includes("Success") == false) {
			specialText = " --!S|Target is blinded by the sand and is at a disadvantage for the next turn."
			targettoken.set("status_pink",true)
		} else {
			specialText = " --!S|Target manages to avoid being blinded for a turn."
		}
	}
	if (special == "Tongue") {
		specialText = " --!S|The target has one chance to work free, requiring an Extreme STR roll. On the next round, the victim goes into Who’s mouth and stomach and automatically dies."
	}
	if (special == "Burn") {
		//CON check if fail another d6 damage
		//opposed POW or lose 1d10 MP
		//Luck check to avoid clothes being set on fire
		con = Number(Attribute(targetchar,"constitution"))
		conCheck = Test(con,0,1,false)[1]
		burnDam = Number(randomInteger(6))
		if (conCheck.includes("Failure")) {specialText += " --!S1|Target sustains an additional " + burnDam + " damage from heat shock."}
		luc = Number(Attribute(targetchar,"luck"))
		lucCheck = Test(luc,0,1,false)[1]
		if (lucCheck.includes("Failure")) {specialText += " --!S2|Targets clothes ignite on fire, causing 1d6 damage per round."}
		pow = Number(Attribute(targetchar,"power"))
		powCheck = Test(pow,0,1,false)[3]
		pow1 = Number(Attribute(attackchar,"power"))
		pow1Check = Test(pow1,0,1,false)[3]
		mpdrain = Number(randomInteger(10))
		mp = Number(Attribute(targetchar,"magicpoints"))
		if (pow1Check > powCheck) {
			specialText += " --!S3|The target has " + mpdrain + " magic points drained as well, feeding the Fire Vampire!"
			if (mpdrain > mp) {
				hp = mpdrain - mp
				specialText += " --!S4|The target is drained of all his MP, and takes " + hp + " hit points extra."
			}
			mp = Math.max(0,(mp-mpdrain))
			AttributeSet(targetchar,"magicpoints",mp)
		}
	}
	if (special == "Maw") {
		specialText = " --!S1|The Tentacle pulls the victim up against its terrible, sucking maws on the following round. While held, the maws can suck flesh from bones, causing 2D10 damage per round thereafter. To break free from a tentacle requires an Extreme STR or DEX roll."
	}

	if (special == "Poison") {
		specialText = " --!S1|The dart is coated with Krait Snake Venom!"
		con = Number(Attribute(targetchar,"constitution"))
		conCheck = Test(con,0,3,false)[1]
		let poisonDam = Number(randomInteger(10))
		if (conCheck.includes("Failure")) {
			specialText += " --!S2|Target sustains an additional " + poisonDam + " damage and is extremely ill for several hours. He may only take a half action each round."
		} else {
			specialText += " --!S2|Target sustains an additional " + (Math.floor(poisonDam/2)) + " damage and feels nauseous."
		}
	}
	//insert new ones here

	return specialText
}





function DamageCheck(dam,char,token,totDam) {
	let charType = Attribute(char,"type")
	if (charType == "ally" || charType == "player") {charType = "PC"}
	if (charType != "PC") {charType = "enemy"}	
	let playID = char.get('controlledby')
	playID = playID.split(",")[0]
	if (playID != "") {charType = "PC"}
	check = ""

	if (charType != "PC") {
		return check
	}

	let maxHitPts = Number(AttributeMax(char,"hitpoints"))
	let curHitPts = Number(Attribute(char,"hitpoints"))
	let endHitPts = curHitPts - dam
	if (totDam) {
		endHitPts = curHitPts - totDam
	}
	let halfHitPts = Number(Math.floor(maxHitPts/2))
	let con = Number(Attribute(char,"constitution"))
	let conRoll = Number(randomInteger(100))

	if (dam >= maxHitPts) { //death
		check = " --Death:| The injury will kill the character."
		token.set("status_2006647: RIP",true)
	} else if (dam >= halfHitPts && dam < maxHitPts) {
		if (endHitPts < 1) {
			check = " --Dying:| The injury is potentially fatal within rounds."
			token.set("status_ 2006646: Dying-Transparent",true)
		} else {
			check = " --Major Wound:|The character has sustained a Major Wound."
			token.set("status_2006466: Blood-Transparent",true)
			if (conRoll > con || conRoll == 100) {
				check += "^^The character is knocked unconscious from the injury."
				token.set("status_interdiction",true)
			} else {
				check += "^^The character is able to remain conscious."
			}
		}
	} else if (dam < halfHitPts && endHitPts < 1) {
		check = " --Unconscious:| The character is knocked unconscious from the injury."
		token.set("status_interdiction",true)
		if (token.get("status_Blood-Transparent") == true) {
			check += " --Dying:| The injury is potentially fatal within rounds."
			token.set("status_ 2006646: Dying-Transparent",true)
		} 
	}
log(check)	
	return check
}






//Individual Actions

if (Action == "Clear") {
	chars = turnorder.length
	if (chars < 1) {return}
	curToken = getObj("graphic",turnorder[0].id)
	curToken.set("status_blue",false)
	curToken.set("status_lightning-helix",false)
	curToken.set("status_bolt-shield",false)
	curToken.set("status_all-for-one",false)
}

if (Action == "Initiative") {
	var firearmQ = Tag[3]
	var dexterity = Number(Attribute(character,"dexterity"))
	var base = Number(dexterity/100)
	var hard = Math.floor(dexterity/2)
	var extreme = Math.floor(dexterity/5)

	if (firearmQ == "Yes") {
		firearmQ = " --rightsub|Firearm Readied"
		dexterity += 50
	} else {
		firearmQ = ""
	}

	result = Test(dexterity)
	roll = result[0]
	DoS = result[1]
	extra = ""

	if (DoS.includes("Regular")) {
		initiative = 20+base
	}
	if (DoS.includes("Fumble")) {
		initiative = 0+base
		extra = "The character is at a disadvantage."
		characterToken.set("status_yellow",true)
	}
	if (DoS.includes("Failure")) {
		initiative = 10 + base
	}
	if (DoS.includes("Hard")) {
		initiative = 20 + base
	}
	if (DoS.includes("Extreme")) {
		initiative = 30 + base
	}
	if (DoS.includes("Critical")) {
		initiative = 40 + base
		extra = "The character is at an advantage for his next action."
		characterToken.set("status_green",true)
	}

	turnorder.forEach((obj, index) => { //removes if there is already initiative for this token
        if (obj.id === characterToken.id) {
            turnorder.splice(index, 1)
            Campaign().set('turnorder', JSON.stringify(turnorder))
        } 
    })

    turnorder.push({ id: characterTokenID, pr: initiative, custom: character, _pageid: characterToken.get("pageid") });
    Campaign().set("turnorder", JSON.stringify(turnorder));
    
	leftsub = "Dex Used:" + dexterity
	if (firearmQ != "") 
	rightsub = firearmQ
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","--leftsub|" + leftsub)
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>",firearmQ)
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")

	powerCardTemplate += " --Roll:|" + roll
	powerCardTemplate += " --Result:|" + DoS
	if (extra != "") {
		powerCardTemplate += " --!A|**" + extra + "**"
	}
	powerCardTemplate += " }}"

	sendChat("",powerCardTemplate)
	
	return
}


if (Action == "Aim") {
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	characterToken.set("status_archery-target",true)
	powerCardTemplate += " --!A|The character aims his weapon for the round. }}"
	sendChat("",powerCardTemplate)
}

if (Action == "Run") {
	var move = Number(Attribute(character,"movement_rate"))
	if (move == 0) {
		size = Number(Attribute(character,"size"))
		dex = Number(Attribute(character,"dexterity"))
		strength = Number(Attribute(character,"strength"))

		if (strength < size && dex < size) {
			move = 7
		} else if (strength > size && dex > size) {
			move = 9
		} else {
			move = 8
		}
	}

	run = Math.round(move * 1.5)
	characterToken.set("status_lightning-helix",true)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	characterToken.set("status_archery-target",true)
	powerCardTemplate += " --!A|The character runs for his round and may move " + run + " yards."
	sendChat("",powerCardTemplate)
}

if (Action == "Reload") {
	var weaponName = Tag[3]
	var subAction = Tag[4]

	var weaponInfo = WeaponInfo(weaponName)
	var weaponAmmo = weaponInfo.Ammo
	var weaponMagSize = weaponInfo.MagSize
	var weaponMagType = weaponInfo.MagType
	weaponName = weaponName.replace(/_/g," ")

	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")

	if (weaponMagType.includes("mag") || weaponMagType.includes("clip")) { //clip is halfmoon/full moon clips or speedloader
		weaponMag = weaponAmmo.replace("Ammo","Mags")
		numberMags = Attribute(character,weaponMag)
		numberRounds = Number(Attribute(character,weaponAmmo))
		if (numberMags == 0) { //out of Magazines
			powerCardTemplate += " --Out of Ammunition.|"
		} else if (subAction == "Reload" || subAction == "Reload&Fire") {
			click.set({playing:true,softstop:false})
			numberMags -= 1
			numberRounds = weaponMagSize
			AttributeSet(character,weaponAmmo,numberRounds)
			AttributeSet(character,weaponMag,numberMags)
			powerCardTemplate += " --" + weaponName +  " Reloaded.|"
			powerCardTemplate += " --Rounds in Clip/Mag:| " + numberRounds
			if (numberMags == 0) {
				powerCardTemplate += " --That was the Last Magazine!|"
			} else {
				powerCardTemplate += " --Clips/Mags Left:|" + numberMags
			}
			if (subAction == "Reload&Fire") {
				characterToken.set("status_all-for-one",true)
				powerCardTemplate += " --Can Fire 1 Round|"
			}
		} else if (subAction == "Inventory") {
			powerCardTemplate += " --Rounds in Clip/Mag:| " + numberRounds
			powerCardTemplate += " --Clips/Mags Left:|" + numberMags
		}
	} else {
		weaponSpares = weaponAmmo.replace("Ammo","Spares") 
		weaponRounds = Attribute(character,weaponSpares)
		currentAmmo = Number(Attribute(character,weaponAmmo))
		if (subAction == "Retrieve") {weaponRounds = weaponMagSize - currentAmmo}
		if (weaponRounds == 0 && subAction != "Retrieve") {
			powerCardTemplate += " --Out of Ammunition.|"
		} else if (subAction == "Reload" || subAction == "Reload&Fire" || subAction == "Retrieve") {
			click.set({playing:true,softstop:false})
			missing = weaponMagSize - currentAmmo
			if (subAction == "Reload&Fire") {missing = 1}
			reload = Math.min(missing,2,weaponRounds) //lesser of either # of rounds that mag can take (missing), # of spare rounds or 2 
			weaponRounds -= reload
			currentAmmo += reload
			AttributeSet(character,weaponAmmo,currentAmmo)
			if (subAction != "Retrieve") {
				AttributeSet(character,weaponSpares,weaponRounds)
				powerCardTemplate += " --Weapon Reloaded with " + reload + " rounds.|"
			} else {
				powerCardTemplate += " --" + reload + " Weapons Retrieved.|"
			}
			powerCardTemplate += " --Now at:| " + currentAmmo
			if (subAction != "Retrieve") {
				powerCardTemplate += " rounds."
			}

			if (weaponRounds == 0 && subAction != "Retrieve") {powerCardTemplate += " --No more rounds!|"}
			if (subAction == "Reload&Fire") {
				characterToken.set("status_all-for-one",true)
				powerCardTemplate += " --Can Fire 1 Round|"
			}	
		} else if (subAction == "Inventory") {
			powerCardTemplate += " --Rounds in Weapon:| " + currentAmmo
			powerCardTemplate += " --Spare Ammunition:| " + weaponRounds
		}
	}

	sendChat("",powerCardTemplate)
}

if (Action == "Dive") {
	var retry = Tag[3]
	var finalLuck = Tag[4]
	var fumbleQ = Tag[5]
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")

	if (retry != "Luck") {
		extraDice = 0
		bonusOut = ""
		fumble = false
		if (characterToken.get("status_green")==true) { // from critical roll during initiative or dodge
			extraDice += 1
			bonusOut += "(+)Advantage^^"
			characterToken.set("status_green",false)
		}
		if (characterToken.get("status_yellow")==true) {//disadvantage from fumble
			extraDice -= 1
			bonusOut += "(-)Fumble^^"
			characterToken.set("status_yellow",false)
		}
		dodge = Number(Attribute(character,"dodge"))
		dodgeResult = Test(dodge,extraDice)
		dodgeRoll = dodgeResult[0]
		dodgeText = dodgeResult[1]
		dodgeLevel = dodgeResult[3]
		finalLuck = dodgeResult[2]

		powerCardTemplate += " --title|Roll: " + dodgeRoll + " vs. Dodge of " + dodge + "^^" + bonusOut 
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
		if (dodgeLevel > 0) {
			powerCardTemplate += " --Success:| The character dives for cover. He loses his next attack. "
			characterToken.set("status_bolt-shield",true)
			if (dodgeLevel == 4) {
				powerCardTemplate += "^^ He is also at an advantage for his next action. "
				characterToken.set("status_green",true)
			}
		} else if (dodgeLevel == -1) {
			powerCardTemplate += " --Fumble:| The character tries to dive for cover but fumbles and loses his next attack. He is now at a disadvantage. }}"
			characterToken.set("status_yellow",true)
			fumble = true
		} else {
			powerCardTemplate += " --Fail:|The character tries to dive for cover but fails. He loses his next attack. }}"
		}
	} else if (retry == "Luck") {
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Luck Used: " + finalLuck)
		if (fumbleQ == "true") {
			powerCardTemplate += " --!A|The character luckily avoids the fumble, but fails to dive for cover. He loses his next attack. "
			characterToken.set("status_yellow",false)
		} else {
			powerCardTemplate += " --!A|Luckily at the last minute the character is able to dive for cover. He loses his next attack."
			characterToken.set("status_bolt-shield",true)
		}
		newLuck = LuckAdjust(characterToken,finalLuck)
		powerCardTemplate += " --Luck Points left:|" + newLuck
	}

	if (retry != "Luck" && dodgeLevel < 1 && finalLuck <= characterLuck ) {
		action = "!Cthulhu Dive Luck " + finalLuck + " " + fumble
		luckButton = luckButton.replace("<<LUCK>>",action)
		luckButton = luckButton.replace("<<FINAL>>",finalLuck)
		luckButton = luckButton.replace("<<SHOOTER>>",characterLuck)
		powerCardTemplate += luckButton
	}
	sendChat("",powerCardTemplate)
}


if (Action == "Sanity") {
	passSanity = state.PulpCthulhu.PassSanity
	failSanity = state.PulpCthulhu.FailSanity

	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Sanity Check")

	characterSanity = Attribute(character,"sanity")
	characterIntelligence = Attribute(character,"intelligence")
	resilientTalent = Talent(character,"resilient")
	sanCheck = Test(characterSanity)

	if (sanCheck[1] == "Fumble") {
		powerCardTemplate += " --!F|The character fumbles his Sanity Check. He takes one involuntary action (GM decides)."
		sanLoss = SanityLoss(failSanity,"Fumble") //max San Loss
	}
	if (sanCheck[1] == "Failure") {
		powerCardTemplate += " --!A|The character fails his Sanity Check. He takes one involuntary action (GM decides). "
		sanLoss = SanityLoss(failSanity,"")
	}
	if (sanCheck[1].includes("Success") && sanCheck[0] != 1) {
		powerCardTemplate += " --!B|The character passes his Sanity Check."
		sanLoss = SanityLoss(passSanity,"")
	} 
	if (sanCheck[0] == 1) {
		powerCardTemplate += " --!C|The character is completely unaffected by the Sanity Check."
		sanLoss = 0
	}

	title = "Sanity Roll: " + sanCheck[0] + " vs. Sanity of " + characterSanity

	if (sanLoss > 0) {
		powerCardTemplate += " --!H|He loses " + sanLoss + " Sanity."	
	}

	if (sanLoss >= 5) {
		intCheck = Test(characterIntelligence,0)
		title += "^^Int Roll: " + intCheck[0]
		if (intCheck[1] == "Fumble" || intCheck[1] == "Failure") {
			powerCardTemplate += " --!I|The memory of the event is repressed."
		} else {
			hours = Number(randomInteger(10))
			rounds = Number(randomInteger(10))
			powerCardTemplate += " --!J|The character goes temporarily insane for " + hours + " hours!"
			powerCardTemplate += " --!JJ|He immediately enters a Bout of Madness. (GM to Roll)"
		}
	}

	if (sanLoss >= characterSanity) {
		powerCardTemplate += " --AIEEE!|This amount of Sanity Loss will drive this character Permanently Insane!"
	}

	title = " --title|" + title
	powerCardTemplate += title

	if (characterType == "PC" && sanLoss > 1) {
		//Resilient Talent is 1 luck/sanity point, still keep to only 1/2 sanity lost
		modSan = Math.floor(sanLoss/2)
		modLuck = modSan*2
		if (resilientTalent == true) {modLuck = modSan}
		if (modLuck > characterLuck) {
			modLuck = characterLuck
			modSan = Math.floor(modLuck/2)
			if (resilientTalent == true) {modSan = modLuck}
		}
		newSanLoss = (sanLoss - modSan)
		action = "!Cthulhu LuckSanity " + characterTokenID + " " + modLuck + " " + newSanLoss
		luckButton = luckButton.replace("<<LUCK>>",action)
		luckButton = luckButton.replace("<<FINAL>>",modLuck)
		luckButton = luckButton.replace("<<SHOOTER>>",characterLuck)
		powerCardTemplate += luckButton
	} 
	sendChat("",powerCardTemplate)
}


if (Action == "GMSanity") {
	passSanity = Tag[3]
	failSanity = Tag[4]

	state.PulpCthulhu = {
		PassSanity: passSanity,
		FailSanity: failSanity,
	}

	output = "Sanity Check: " + passSanity + "/" + failSanity

	sendChat("GM",output)
}


if (Action == "LuckSanity") {
	finalLuck = Number(Tag[3])
	newSanLoss = Number(Tag[4])
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Luck Used")
	powerCardTemplate += " --!A|Luckily the sight does not seem to affect the character's Psyche quite as much."
	powerCardTemplate += " --Sanity Points Lost:|" + newSanLoss
	if (newSanLoss >=5) {
		powerCardTemplate += " --!B|The other effects on Sanity still apply."
	}
	newLuck = LuckAdjust(characterToken,finalLuck)
	powerCardTemplate += " --!B|Luck Points Left: " + newLuck
	sendChat("",powerCardTemplate)
}

if (Action == "Ranged") {
	var targetTokenID = Tag[3]
	var weaponName = origWeaponName = Tag[4]
	var weaponMod = Tag[5] //used for things like Auto vs Suppressive, or for Scope and similar
	var numberShots = Tag[6] // for weapons with multiple shots
	if (characterToken.get("status_all-for-one") == true) {
		numberShots = 1
	}

	var	burstArray = []
	var meleeArray = []
	var burstRange = 0

	var characterAim = characterToken.get("status_archery-target")
	var dexterity = Attribute(character,"dexterity")

	//Pulp talents
	var beadyEyed = Talent(character,"beady_eyed")
	var rapidFire = Talent(character,"rapid_fire")

	var targetToken = findObjs({_type: "graphic", id: targetTokenID})[0]
	var targetCharacter = getObj("character",targetToken.get("represents"))
	var targetName = targetToken.get("name")
	var targetBuild = Attribute(targetCharacter,"build")
	var targetSpeed = targetToken.get("status_lightning-helix")
	var targetDove = targetToken.get("status_bolt-shield")

	armourText = Attribute(targetCharacter,"armor_value").toString()
	armour = Number(armourText.replace(/\D/g,''))
	if (isNaN(armour)) {armour = 0}
	altArmourText = Attribute(targetCharacter,"armor").toString()
	altArmour = Number(altArmourText.replace(/\D/g,''))	 //NPCs appear to have different titled value
	if (isNaN(altArmour)) {altArmour == 0}

	targetArmour = Math.max(armour,altArmour)

	var targetHelpless = targetToken.get("status_interdiction")

	//get Weapon Info incl relevant stat, range, damage
	var weaponInfo = WeaponInfo(weaponName)

	if (weaponInfo.Special.includes("magical")) {
		targetArmour = 0
	}

	var weaponSkill = weaponInfo.Skill
	var weaponRange = Number(weaponInfo.Range)
	if (weaponMod.includes("Scope")) { //telescopic sight doubles base range
		weaponRange *= 2
	}
	var weaponDamage = weaponInfo.Damage //eg 1d10
	var impale = weaponInfo.Impale //true or false
	var malfunctionNo = Number(weaponInfo.Malfunction)
	var malfunctionEffect = weaponInfo.MalEffect
	var weaponSpecial = weaponInfo.Special //eg shotgun
	var weaponAmmo = weaponInfo.Ammo
	var weaponMagSize = weaponInfo.MagSize
	var weaponMagType = weaponInfo.MagType
	var soundFile = weaponInfo.Sound
	var track = findObjs({type:"jukeboxtrack", title: soundFile})[0]
	if (!track) {track = ""}

	//wpnDamage broken down  eg 1d10+10
	var weaponDamage = weaponDamage.split("d")
	var numDice = Number(weaponDamage[0])
	var dicePart2 = weaponDamage[1]
	var dicePart2 = dicePart2.split("+")
	var diceSides = Number(dicePart2[0])
	var bonusToDice = Number(dicePart2[1])
	if (!bonusToDice) {bonusToDice = 0}

	//Special for Solid Slugs in Shotgun
	if (weaponMod.includes("Solid")) {
		if (weaponName.includes("12")) { //12 gauge solid = 1d10+6, base range 50yds, may impale
			numDice = 1
			diceSides = 10
			bonusToDice = 6
			weaponRange = 50
			impale = true
		}
	}

	var characterAmmo = Number(Attribute(character,weaponAmmo))
	if (characterType == "PC" && characterAmmo == 0) {
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
		powerCardTemplate += " --!A|" + characterName + " tries to fire his " + weaponName.replace(/_/g," ")
		powerCardTemplate += ", but the weapon is empty."
		sendChat("",powerCardTemplate)
		return
	}

	if (!numberShots) {
		numberShots = 1
	} else numberShots = Number(numberShots)
	var Auto = false
	if (weaponMod.includes("Auto") && numberShots > 1) {
		Auto = true
	}
	
	//check ammo for auto
	if (characterType == "PC") {
		numberShots = Math.min(numberShots,characterAmmo)
	}

	if (Auto == true && numberShots > 3) {
		if (numberShots < 6) {burstRange = scale} 
		if (numberShots > 5 && numberShots < 11 ) {burstRange = 2*scale}
		if (numberShots >= 20) {burstRange = 3*scale}
	}

	var weaponName = weaponName.replace(/_/g, ' ')


	//retrieve relevant weapon stat


	if (weaponSkill == "SMG") {
		if (Attribute(character,"firearms_skill_1_name") == "SMG") {
			weaponSkill = "firearms_skill_1"
		}
		if (Attribute(character,"firearms_skill_2_name") == "SMG") {
			weaponSkill = "firearms_skill_2"
		}
	}

	if (weaponSkill == "MG") {
		if (Attribute(character,"firearms_skill_1_name") == "MG") {
			weaponSkill = "firearms_skill_1"
		}
		if (Attribute(character,"firearms_skill_2_name") == "MG") {
			weaponSkill = "firearms_skill_2"
		}
	}

	var stat = Attribute(character,weaponSkill)



	var verb = " fires his "
	var noun = "Shot"
	var meleeDB = 0

	if (weaponSkill == "throw" ) { //add bows in here later
		verb = " throws his "
		noun = "Attack"
		strength = Number(Attribute(character,"strength"))
		weaponRange = Math.round(strength/5)
		//Thrown weapons give 1/2 DB
		var meleeDB = Attribute(character,"damage_bonus")
		if (meleeDB && meleeDB != 0) {
			if (meleeDB.includes("d") == false) {
				meleeDB = Math.floor(meleeDB/2)
			} else {
				db = meleeDB.split("d")
				dbNum = Number(db[0])
				dbSides = Number(db[1])
				dbNum = Math.floor(dbNum/2)
				if (dbNum < 1) {
					dbNum = 1
					dbSides = Math.floor(dbSides/2)
				}
				if (dbSides == 0 || dbNum == 0) {meleeDB = 0}
				meleeDB = dbNum.toString() + "d" + dbSides.toString()

			}
		}
	}

	if (weaponSkill == "telekinesis") {
		throwSkill = Number(Attribute(character,"throw"))
		stat = Math.min(stat,throwSkill) // roll under both, so roll under the lowest 
		verb = " uses his mind to hurl his "
		noun = "Object"
		weaponRange = 5
	}

	coverArray = CoverArray(currentPageGraphics)

	//create an array of combatants next to target, in case of fumble - meleeArray
	//and also an array of all targets next to original target, for Auto Burst firing
	burstArray.push(targetToken) //adds original target to burst array
	for (let i=0;i<cpgLength;i++) {
		let tok = currentPageGraphics[i]
		let tokChar = getObj("character",tok.get("represents"))
		if (!tokChar) {continue}
		let targetType = Attribute(tokChar,"type")
		if (targetType == "ally" || targetType == "player") {targetType = "PC"}
		if (targetType != "PC") {targetType = "enemy"}	

		var tarPlayerID = tokChar.get('controlledby')
		var tarPlayerID = tarPlayerID.split(",")[0]
		if (tarPlayerID != "") {targetType = "PC"}

		let tokName = tok.get("name")
		if ((tokName.includes("Cover") || tokName.includes("cover")) == true) {continue}
		if (tok == characterToken || tok == targetToken) {continue}
		let dist = Distance(tok,targetToken,scale)
		//check if LOS blocked (shooter to token) and if blocked, dont add to arrays
		shooterX = characterToken.get("left")
		shooterY = characterToken.get("top")
		targetX = tok.get("left")
		targetY = tok.get("top")
		check = TargetIntersection(shooterX,shooterY,targetX,targetY) //returns true if no wall, else returns coordinates (not used for ranged)
		if (check != true) {continue}
		if (dist <= burstRange) { // all targets within burst range
			burstArray.push(tok)
		}
		if (dist <= scale && targetType == characterType) { // all 'friendly' targets in melee range of intended target
			meleeArray.push(tok)
		}
	}


	burstArrayNum = Math.min(burstArray.length,numberShots) //# of targets next to original Target (for Auto Burst fire) to max of # of shots
	burstArray.length = burstArrayNum
	meleeNum = meleeArray.length //# of combatants next to target

	burstCheck = Math.floor(numberShots/burstArrayNum)
	if (burstCheck < 1.5) {
		burstLethal = false
	} else {
		burstLethal = true
	}
	//Special for Auto Fire (Thompson SMG only currently) using Delta Green Rules
	if (Auto == true && burstLethal == true) {
		numDice = 2
		diceSides = 10
		bonusToDice = 0	
	}
	
	// get range from shooter to target, compare to range to pick bracket
	range = Distance(characterToken,targetToken,scale)

	if (weaponSpecial.includes("Shotgun") && weaponMod.includes("Solid") == false) {
		bracket = 1 //no reduced chance to hit but instead reduced damage
		if (range<=(weaponRange*5) && range>(weaponRange*2) && weaponName.includes("Sawed")==false) {
			numDice = Math.round(numDice/4)
		} else if (range<=(weaponRange*2) && range>weaponRange && weaponName.includes("Sawed")) {
			numDice = Math.round(numDice/4)
		} else if (range<=(weaponRange*2) && range>weaponRange && weaponName.includes("Sawed")==false) {
			numDice = Math.round(numDice/2)
		}
	} else {
		if (range<=(weaponRange*4) && range>(weaponRange*2)) {
			bracket = 3
		} else if (range<=(weaponRange*2) && range>weaponRange) {
			bracket = 2
		} else if (range<=weaponRange) {
			bracket = 1
		}
	}

	environment = ""
	for (let t=0;t<gmArray.length;t++) {
		if (gmArray[t].get("name").includes("Darkness")) {
			bracket = Math.min(bracket+1,3)
			environment = "Darkness"
		}
		if (gmArray[t].get("name").includes("Difficult")) {
			bracket = Math.min(bracket+1,3)
			environment = "Difficult"
		}
	}

	//check if target is out of range
	if ((range>(weaponRange*4) && weaponSpecial.includes("Shotgun") == false) || (range>(weaponRange*5) && weaponSpecial.includes("Shotgun"))) {
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
		powerCardTemplate += " --!A|" + characterName + verb + weaponName + " at " + targetName
		if (numberShots > 1) {
			powerCardTemplate += " but the shots miss as the range is too far."
		} else {
			powerCardTemplate += " but the shot misses as the range is too far."
		}

		if (characterType == "PC") {
			characterAmmo -= numberShots
			if (characterAmmo<0) {characterAmmo = 0}
			AttributeSet(character,weaponAmmo,characterAmmo) //update ammo
			if (characterAmmo > 0) {
				powerCardTemplate += " --Remaining Ammo:|" + characterAmmo
			} else {
				powerCardTemplate += " --OUT OF AMMO!|"
			}
		}
		sendChat("",powerCardTemplate)
		return
	}	


	//check if LOS blocked
	shooterX = characterToken.get("left")
	shooterY = characterToken.get("top")
	targetX = targetToken.get("left")
	targetY = targetToken.get("top")

	check = TargetIntersection(shooterX,shooterY,targetX,targetY)

	if (check != true) {
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")

		if (numberShots > 1) {
			powerCardTemplate += " --!A|The shots ping off an intervening wall."
		} else {
			powerCardTemplate += " --!A|The shot pings off an intervening wall."
		}

		if (characterType == "PC") {
			characterAmmo -= numberShots
			if (characterAmmo<0) {characterAmmo = 0}
			AttributeSet(character,weaponAmmo,characterAmmo) //update ammo
			if (characterAmmo > 0) {
				powerCardTemplate += " --Remaining Ammo:|" + characterAmmo
			} else {
				powerCardTemplate += " --OUT OF AMMO!|"
			}
		}
		sendChat("",powerCardTemplate)
		return
	}

	//attribute name for skillcheck
	skillCheck = weaponSkill + "-check"

	//figure any bonus or penalty dice out

	extraDice = 0
	bonusOut = ""

	if (environment.includes("Difficult")) {
		bonusOut += "Difficulty Shooting^^"
	}
	if (environment.includes("Darkness")) {
		bonusOut += "Darkness"
	}

	if (targetName.includes("Polyp")) {
		if (targetToken.get("aura1_color") == "#000000") { //invisible, listen test to locate
			let listen = Number(Attribute(character,"listen"));
			if (listen < 20) {listen = 20}	
			let listenTest = Test(listen,0,1,"");	
			if (listenTest[1].includes("Success") == false) {
				powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
				powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
				powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
				powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
				powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
				powerCardTemplate += " --!B|The character is unable to pinpoint the sound of the Polyp."
				sendChat("",powerCardTemplate)
				return
			} else {
				powerCardTemplate += " --!I|The character is able to guess the rough location of the Polyp through a successful Listen Test.";
				bonusOut += "(-)Target is Invisible^^";
				extraDice -= 1;
			}
		} else { //check luck to see if goes invisible
			let luck = Number(Attribute(character,"luck"));
			let luckTest = Test(luck,0,1,"")
			if (luckTest[1].includes("Success") == false) {
				powerCardTemplate += " --!B|The Polyp fades into Invisibility just as the character attacks."
				bonusOut += "(-)Target is Invisible^^";
				extraDice -= 1;
				targetToken.set({
					aura1_color: "#000000",
					aura1_radius: 1,
				})
			} 
		}
	}

	//Surprised Target
	if (targetToken.get("status_sleepy")==true || targetHelpless == true) {//target is surprised or helpless
		extraDice += 1
		bonusOut += "(+)Surprised/Helpless^^"
	}
	//Target has Fumble penalty
	if (targetToken.get("status_yellow")==true) { //target disadvantaged due to a fumble roll
		extraDice += 1
		bonusOut += "(+)Target Fumbled^^"
	}
	if (characterToken.get("status_green")==true) { // from critical roll during initiative or dodge
		extraDice += 1
		bonusOut += "(+)Shooter has Advantage^^"
		characterToken.set("status_green",false)
	}

	if (characterToken.get("status_sentry-gun") == true) {
		extraDice += 1
		bonusOut += " (+)Insane Accuracy^^"
	}

	//Point Blank
	pointBlankRange = Math.floor(dexterity/15) //dex/5 in feet then /3 to convert to yds/m
	characterPower = Attribute(character,"power")
	if (weaponSkill == "telekinesis") {pointBlankRange = Math.floor(characterPower/15)}
	if (range<=pointBlankRange && weaponSpecial.includes("Long") == false) {
		extraDice += 1
		bonusOut += "(+)Point Blank^^"
	}
	//Target Build 4+
	if (targetBuild>3) {
		extraDice += 1
		bonusOut += "(+)Target Build Large^^"
	}

	//Aim (uses a token marker)
	if (characterAim == true) {
		extraDice += 1
		characterToken.set("status_archery-target",false)
		bonusOut += "(+)Aim^^"
	}

	//Prone for firearms
	if (characterToken.get("status_back-pain") == true && weaponSkill != "throw" && weaponSkill.includes("bow")==false && weaponSkill != "telekinesis") {
		extraDice += 1
		bonusOut += "(+)Shooter is prone^^"
	}

	//Penalty Dice
	if (characterToken.get("status_lightning-helix")==true) {
		extraDice -= 1
		bonusOut += "(-)Shooter Speed^^"
	}



	if (characterToken.get("status_pink")==true) {
		extraDice -= 1
		bonusOut += "(-)Shooter Disadvantaged.^^"
	}

	if (characterToken.get("status_yellow")==true) {//attacker has disadvantage
		extraDice -= 1
		bonusOut += "(-)Shooter has Fumbled^^"
		characterToken.set("status_yellow",false)
	}

	//Cover - does firing line cross cover
	cover = CoverCheck(characterToken,targetToken,coverArray,scale)
	if (cover == true) {
		extraDice -= 1	
		bonusOut += "(-)Cover^^"
	}

	if (targetToken.get("status_back-pain")==true && cover == false && targetDove == false) { //target is prone, penalty to hit
		//doesnt get if already has cover, or dove for cover
		extraDice -= 1
		bonusOut += "(-)Target is Prone^^"
	}

	//Target's Speed
	if (targetSpeed == true) {
		extraDice -= 1
		bonusOut += "(-)Target Speed^^"
	}
	//Reload and Fire
	if (characterToken.get("status_all-for-one") == true) { //attacker is loading and firing a round
		extraDice -= 1
		bonusOut += "(-)Shooter Load & Fire^^"
	}



	//Target Build -2 or less
	if (targetBuild <= -2) {
		if (beadyEyed == true && characterAim == true) {
			bonusOut += "(0) Beady Eye^^"
		} else {
			extraDice -= 1
			bonusOut += "(-)Target Build Small^^"
		}
	}

	//Dove for Cover
	if (targetDove == true && cover == false) { //dove for cover and isnt now behind cover, else gets cover
		extraDice -= 1
		bonusOut += "(-)Target Dove for Cover^^"
	}
	//Multiple Shots
	if (numberShots > 1 && weaponSpecial.includes("MB") == false && rapidFire != true) {
		extraDice -= 1
		bonusOut += "(-)Multiple Shots^^"
	}
	//Firing into Melee Combat
	if (meleeNum > 0 && Auto == false && beadyEyed != true) {
		extraDice -= 1
		bonusOut += "(-)Firing into Melee^^"
	}

	//part 1 - adjust difficulty pbased on penalty Dice, which max at +/- 2
	if (extraDice < -2) {
		bracket -= (extraDice + 2)
		bracket = Math.min(bracket,3)
		extraDice = -2
	}
	if (extraDice > 2) {
		bracket -= (extraDice - 2)
		bracket = Math.max(bracket,1)
		extraDice = 2
	}

	var results = ""
	var totalDamage = 0
	var jam = false
	var friendlyFire = false
	var title = ""
	var outofAmmo = false
	var finalLuck = characterLuck + 1
	var	luckTokenID = targetTokenID // as Auto may be multiple targets, only one of which will be hit if using Luck

	//Single Target Fire (most weapons)
	if (Auto == false) {
		if (track) {
			track.set({playing: true,softstop:false})
		}

		extraMsg = ""
		for (let s = 0 ;s<numberShots;s++) {
			damage = 0
			var shot = s + 1
			var res = Test(stat,extraDice,bracket,true)
			var shotRes = noun + " #" + shot + " misses.^^"
			luck = res[2]
			luckDamage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,targetArmour,meleeDB)
			if (res[1] == "Regular Hit") {
				damage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,targetArmour,meleeDB)
				shotRes = noun + " #" + shot + " hits, doing " + damage + " damage.^^"
				AttributeSet(character,skillCheck,"on")
			}

			if (res[1] == "Extreme Hit") {
				damage = Damage(numDice,diceSides,bonusToDice,"Extreme",impale,targetArmour,meleeDB)
				shotRes = noun + " #" + shot + " scores an Extreme Hit, doing " + damage + " damage.^^"
				AttributeSet(character,skillCheck,"on")
			}

			if (res[1] == "Critical Hit") {
				damage = Damage(numDice,diceSides,bonusToDice,"Critical",impale,targetArmour,meleeDB)
				shotRes = noun + " #" + shot + " scores a Critical Hit, doing " + damage + " damage.^^"
				AttributeSet(character,skillCheck,"on")
			}

			if (res[0] >= malfunctionNo && meleeNum == 0 && characterToken.get("status_sentry-gun") == false ) { //Jam or Dud round
				damage = 0
				shotRes = noun + " #" + shot + " fails as " + malfunctionEffect
				jam = true
				luck = 10
			}
			if (res[1] == "Fumble" && res[0] < malfunctionNo && meleeNum == 0 && characterToken.get("status_sentry-gun") == false) {
				damage = 0
				shotRes = noun + " #" + shot + " - the weapon is fumbled and the " + noun.toLowerCase() + " misses.^^"
			}

			if (res[1] == "Fumble" && meleeNum > 0 && characterToken.get("status_sentry-gun") == false) {
				damage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,targetArmour,meleeDB)
				targetNum = Number(randomInteger(meleeArray.length)) - 1 //as array is 0 ordered
				targetToken = meleeArray[targetNum]
				targetName = targetToken.get("name")
				shotRes = noun + "#" + shot + " misses the original target and instead hits " + targetName + ", doing " + damage + " damage.^^"
				luck = 10
				friendlyFire = true
			}

			insaneA = false
			if (characterToken.get("status_sentry-gun") == true && (res[1] == "Fumble" || shotRes.includes("misses"))) {
				luck = 10
				damage = Damage(numDice,diceSides,bonusToDice,"Extreme",impale,0,meleeDB)
				shotRes = characterName + " scores an Extreme Hit on a friendly target or something of great value, doing " + damage + " damage.^^"
				shotRes += "Insane Accuracy Ends and the character stops firing..."
				characterToken.set("status_sentry-gun",false)
				friendlyFire = true
				insaneA = true
			}


			results += shotRes		
			totalDamage += damage

			if (totalDamage > 0) {
				extraMsg += DamageSpecial(weaponSpecial,character,targetCharacter,targetToken)
			}

			extraMsg += DamageCheck(damage,targetCharacter,targetToken,totalDamage)

			title += noun + "# " + shot + " Roll: " + res[0] + "^^"
			if (characterType == "PC") { //PCs and allied NPCs
				characterAmmo -= 1
				if (characterAmmo <= 0) {
					outofAmmo = true 
				}
			}	
			finalLuck = Math.min(luck,finalLuck)
			if (jam == true || outofAmmo == true || insaneA == true) {break}
		}
		if (outofAmmo == true) {
			title += "Ran out of Ammo."		

		}
		results += extraMsg
	}

	//Auto Fire (SMG and MG)
	if (Auto == true) {
		if (track) {
			track.set({playing: true,softstop:false})
		}

		for (let target = 0;target<burstArrayNum;target++) { //roll to hit, damage etc for each target
			tartoken = burstArray[target]
			tartokenID = tartoken.id
			name = tartoken.get("name")
			tokenChar = getObj("character",tartoken.get("represents"))
			res = Test(stat,extraDice,bracket,true)
			shotRes = name + " is missed.^^"
			luck = res[2]
			if (luck < finalLuck && luck != 0) {
				if (burstLethal == true) {
					luckDamage = LethalDamage(characterToken,tartoken,coverArray,scale,10)
					if (luckDamage != "lethal") {
						luckDamage -= targetArmour
					}
				} else {
					luckDamage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,targetArmour,0)
				}
				luckTokenID = tartokenID
				finalLuck = luck
			}

			if (res[1] == "Regular Hit") {
				AttributeSet(character,skillCheck,"on")

				if (burstLethal == true) {
					damage = LethalDamage(characterToken,tartoken,coverArray,scale,10) //currently all auto weapons are 10% lethality
				} else {
					damage = Damage(numDice,diceSides,bonusToDice,"Normal",impale,targetArmour,0)
				}
				if (damage == "lethal") {
					shotRes = name + " suffers lethal damage.^^"
				} else {
					damage -= targetArmour
					shotRes = name + " takes " + damage + " damage.^^"
				}
			}

			if (res[1] == "Extreme Hit") {
				AttributeSet(character,skillCheck,"on")

				damage = LethalDamage(characterToken,tartoken,coverArray,scale,10)
				if (damage == "lethal") {
					shotRes = name + " suffers lethal damage.^^"
				} else {
					if (burstLethal == true) {
						damage = 20 - targetArmour
					} else {
						damage = Damage(numDice,diceSides,bonusToDice,"Extreme",impale,targetArmour,meleeDB)
					}
					shotRes = name + " takes " + damage + " damage. (Extreme)^^"
				}
			}
			if (res[1] == "Critical Hit") {
				AttributeSet(character,skillCheck,"on")

				shotRes = name + " suffers lethal damage. (Critical)^^"
			}
			if (damage != "lethal") {
				shotRes += DamageCheck(damage,tokenChar,tartoken)
			}

			if (res[0] >= malfunctionNo && characterToken.get("status_sentry-gun") == false) { //Jam or Dud round
				results = "The gun jams!^^"
				title = "Jam, Roll: " + res[0] + "^^"
				finalLuck = 10
				jam = true
				break
			}
			if (res[1] == "Fumble" && res[0] < malfunctionNo && characterToken.get("status_sentry-gun") == false) {
				results = "The weapon is fumbled and the burst completely misses."
				title = "Fumble, Roll: " + res[0] + "^^"
				break
			}
			if (characterToken.get("status_sentry-gun") == true && shotRes.includes("missed")) {
				finalLuck = 10
				damage = Damage(numDice,diceSides,bonusToDice,"Extreme",impale,0,meleeDB)
				results = characterName + " scores an Extreme Hit on a friendly target or something of great value, doing " + damage + " damage.^^"
				results += "Insane Accuracy Ends and the character stops firing..."
				characterToken.set("status_sentry-gun",false)
				friendlyFire = true
				break
			}
			results += shotRes
			title += "Target# " + (target+1) + " Roll: " + res[0] + "^^"
		}
		if (characterType == "PC") {
			characterAmmo -= numberShots
		}
		shot = numberShots
	}



	//update Ammo and reset any Advantage
	if (characterType == "PC") {
		AttributeSet(character,weaponAmmo,characterAmmo)
	}
	characterToken.set("status_green",false)

	//output results

	leftsub = " --leftsub|" 
	if (bracket == 1) leftsub += "Regular"
	if (bracket == 2) leftsub += "Hard"
	if (bracket == 3) leftsub += "Extreme"

	if (extraDice != 0) {
		if (extraDice < 0) {
			rightsub = " --rightsub|" + Math.abs(extraDice) + " Penalty Dice"
		}
		if (extraDice > 0) {
			rightsub = " --rightsub|" + extraDice + " Bonus Dice"
		}
	} else {rightsub = ""}

	if (bonusOut == "") {bonusOut = "Nil^^"}
	powerCardTemplate += " --title|Range: " + range + " yds.^^Bonus/Penalty Dice:^^" + bonusOut + title
	emote = characterName + verb + weaponName + " at " + targetName
	if (Auto == true && numberShots > 3) {
		emote += " and the targets nearby."
	}


	tokenTemplate = tokenTemplate.replace("<<SUBJECTTOK>>",characterTokenID)
	tokenTemplate = tokenTemplate.replace("<<TARGETTOK>>",targetTokenID)
	powerCardTemplate += tokenTemplate

	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>",rightsub)
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)

	if (Auto == true && numberShots > 1) {
		powerCardTemplate += " --!A2|A burst of " + numberShots + " rounds was fired."
	}

	if (shot > 1 && weaponSpecial.includes("MB") == false && Auto == false) {
		powerCardTemplate += " --!A2|" + shot + " " + noun 
		if (weaponSkill == "throw") {
			bit = "s are thrown."
		} else if (weaponSkill == "telekinesis") {
			bit = "s are hurled by telekinesis."
		} else {
			bit = "s are fired."
		}
		powerCardTemplate += bit
	}
	if (shot > 1 && weaponSpecial.includes("MB") == true) {
		powerCardTemplate += " --!A2|Both Barrels are Fired!"
	}

	powerCardTemplate += " --!R|" + results

	if (shot > 1 && Auto == false && totalDamage > 0) {
		powerCardTemplate += " --Total Damage:|" + totalDamage
	}
	if (characterType == "PC") {
		if (characterAmmo > 0) {
			powerCardTemplate += " --Remaining Ammo:|" + characterAmmo + "^^"
		} else {
			powerCardTemplate += " --OUT OF AMMO!|^^"
			if (characterToken.get("status_sentry-gun") == true) {
				characterToken.set("status_sentry-gun",false)
				powerCardTemplate += " --Insane Accuracy Ends.|"
			}
		}
	}
	
	if (characterType == "PC" && finalLuck > 0 && finalLuck <= characterLuck) {
		action = "!Cthulhu RangedLuck " + characterTokenID + " " + luckTokenID + " " + luckDamage + " " + finalLuck + " " + friendlyFire + " " + jam
		luckButton = luckButton.replace("<<LUCK>>",action)
		luckButton = luckButton.replace("<<FINAL>>",finalLuck)
		luckButton = luckButton.replace("<<SHOOTER>>",characterLuck)
		powerCardTemplate += luckButton
	}
	


	sendChat("",powerCardTemplate)




} // End Ranged

if (Action == "RangedLuck") {
	var targetTokenID = Tag[3]
	var damage = Tag[4]
	var finalLuck = Tag[5]
	var friendlyFire = Tag[6]
	var jam = Tag[7]
log(Tag)
	var targetToken = findObjs({_type: "graphic", id: targetTokenID})[0]
	var targetName = targetToken.get("name")

	leftsub = " --leftsub|Luck Used: " + finalLuck

	powerCardTemplate += tokenTemplate
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)

	if (friendlyFire == "false" && jam == "false" && isNaN(damage) == false) {
		powerCardTemplate += " --" + targetName + "| takes " + luckDamage + " damage from a lucky shot."
	} else if (friendlyFire == "true") {
		powerCardTemplate += " --!FF|Luckily the shots go wide and your ally is not hit."
	} else if (jam == "true") {
		powerCardTemplate += " --!JAM|Luckily the gun somehow unjams itself."
	} else if (isNaN(damage)) {
		powerCardTemplate += " --" + targetName + "| takes lethal damage from a lucky shot."
	} 

	newLuck = LuckAdjust(characterToken,finalLuck)
	powerCardTemplate += " --Luck Points left:|" + newLuck
	sendChat("",powerCardTemplate)


} //end Ranged Luck

if (Action == "Blast") {
	var targetTokenID = Tag[3]
	var weaponName = originalWeaponName = Tag[4]
	var weaponMod = Tag[5]
	var originalX = Tag[6]
	var originalY = Tag[7]
	var finalLuck = Tag[8]

	var targetToken = findObjs({_type: "graphic", id: targetTokenID})[0]
	var targetName = targetToken.get("name")

	//get Weapon Info incl relevant stat, range, damage
	var weaponInfo = WeaponInfo(weaponName)
	var weaponSkill = weaponInfo.Skill

	var characterStrength = Number(Attribute(character,"strength"))
	var weaponRange = Math.round(characterStrength/5) 

	var weaponDamage = weaponInfo.Damage //eg 1d10
	var impale = weaponInfo.Impale //true or false
	var malfunctionNo = Number(weaponInfo.Malfunction)
	var malfunctionEffect = weaponInfo.MalEffect
	var weaponSpecial = weaponInfo.Special
	var weaponAmmo = weaponInfo.Ammo
	var weaponMagSize = weaponInfo.MagSize
	var weaponMagType = weaponInfo.MagType
	var soundFile = weaponInfo.Sound

	var characterAmmo = Number(Attribute(character,weaponAmmo))
	var weaponName = weaponName.replace(/_/g, ' ')
	var lethality = 15 //later if other lethalities can put into weapon info
	var stat = Number(Attribute(character,weaponSkill)) 
	var extraDice = 0
	var bonusOut = ""

	var skillCheck = weaponSkill + "-check"

	if (characterType == "PC" && characterAmmo == 0) {
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
		powerCardTemplate += " --!A|" + characterName + " tries to use a " + weaponName
		powerCardTemplate += ", but is out."
		sendChat("",powerCardTemplate)
		return
	}

	var track = findObjs({type:"jukeboxtrack", title: soundFile})[0]
	if (!track) {track = ""}

	var jamtrack = findObjs({type:"jukeboxtrack", title: "Jam"})[0]	

	coverArray = CoverArray(currentPageGraphics)

	//target could be target icon or a character/monster
	//Throw% to hit, If success, on target, Fail = deviation, higher difference = more deviation
	//Fumble = explodes on self/Malfunction = same

	if (characterToken.get("status_green")==true) { // from critical roll during initiative or dodge
		extraDice += 1
		bonusOut += "(+)Shooter has Advantage^^"
		characterToken.set("status_green",false)
	}

	if (characterToken.get("status_yellow")==true) {//attacker has disadvantage
		extraDice -= 1
		bonusOut += "(-)Shooter has Fumbled^^"
		characterToken.set("status_yellow",false)
	}

	if (characterToken.get("status_pink")==true) {//attacker has disadvantage
		extraDice -= 1
		bonusOut += "(-)Shooter Disadvantaged^^"
	}

	if (characterType == "PC" && characterAmmo == 0 && weaponMod.includes("Luck") == false) {
		output = PCHeaders(characterToken,targetToken)
		output += " --!A|" + characterName + " tries to throw a " + weaponName
		output += ", but has none left."
		output += " }}"
		sendChat("",output)
		return
	}

	//default is that it lands on target
	shooterX = characterToken.get("left")
	shooterY = characterToken.get("top")

	if (weaponMod.includes("Luck")) {
		targetToken.set("left",originalX)
		targetToken.set("top",originalY)
	}

	blastX = epiX = targetToken.get("left")
	blastY = epiY = targetToken.get("top")

	range = Distance(characterToken,targetToken,scale)
	if (range > weaponRange *4) { //set to max range using like triangles/ratio
		ratio = (weaponRange * 4) / range
		a = blastX - shooterX
		b = blastY - shooterY
		blastX = (a * ratio) + shooterX
		blastY = (b * ratio) + shooterY
 	}

	//check walls for initial throw, stop at a wall if in way

	walls = TargetIntersection(shooterX,shooterY,blastX,blastY)
	if (walls != true) {
		blastX = walls[0]
		blastY = walls[1]
	}

log("Walls: " + walls)

	if (range<=(weaponRange*4) && range>(weaponRange*2)) {
		bracket = 3
	} else if (range<=(weaponRange*2) && range>weaponRange) {
		bracket = 2
	} else if (range<=weaponRange) {
		bracket = 1
	}

	var res =Test(stat,extraDice,bracket,true)
	scatter = misfire = false

	if (res[3] > 0 && weaponMod.includes("Luck") == false) { //sets skill check to on for XP
		AttributeSet(character,skillCheck,"on")
	}

	if (res[1] == "Failure" && weaponMod.includes("Luck") == false) { //scatters based on bracket
		if (bracket == 1) { // +/- 2m
			dX = 3 - Number(randomInteger(5))
			dY = 3 - Number(randomInteger(5))
		}
		if (bracket == 2) { // +/- 4m
			dX = 5 - Number(randomInteger(9))
			dY = 5 - Number(randomInteger(9))

		}
		if (bracket == 3) { // +/- 6m
			dX = 7 - Number(randomInteger(13))
			dY = 7 - Number(randomInteger(13))
		}

		blastX += (dX*scale*70)
		blastY += (dY*scale*70)

		//check walls between initial blast point (epi) and new one to see if wall stops it

		walls = TargetIntersection(epiX,epiY,blastX,blastY)
		if (walls != true) {
			blastX = walls[0]
			blastY = walls[1]
		}

		scatter = true
		finalLuck = res[2]

	}



	if (res[1] == "Fumble" ||res[0] >= malfunctionNo && weaponMod.includes("Luck") == false) { //explodes in hand
		blastX = characterToken.get("left")
		blastY = characterToken.get("top")
		misfire = true
		finalLuck = 10
	}

	//place target icon at scatter location or move old if a Target Icon
	if (targetName.includes("Target")) {
		targetToken.set("left",blastX)
		targetToken.set("top",blastY)
	} else {
	    newToken = createObj("graphic", {   //create the grenade token
	    represents: "-MVOfvfkCA2Ask7QskpF",
	    left: blastX,
	    top: blastY,
	    width: 70,   
	    height: 70,  
	    name: "Target Icon",
	    isdrawing: true,
	    controlledby: "all",
	    pageid: targetToken.get("pageid"),
	    imgsrc: "https://s3.amazonaws.com/files.d20.io/images/105823565/P035DS5yk74ij8TxLPU8BQ/thumb.png?15826799915",
	    layer: "objects",
	    });

		targetToken = newToken
		targetTokenId = targetToken.id
		targetName = "Target Icon"
	}

	//now create an array of all characters in blast radius
	bIndex = weaponSpecial.indexOf("Blast(") + 6
	blastRadius = Number(weaponSpecial.charAt(bIndex))
	blastArray = []
	results = ""

	for (c=0;c<cpgLength;c++) {
		let token = currentPageGraphics[c]
		let tokenChar = getObj("character",token.get("represents"))
		if (!tokenChar) {continue}
		name = token.get("name")
		if (name.includes("Target")) {continue}
		if (name.includes("Cover")) {continue}    //maybe later have it affect Cover items
		tokenX = token.get("left")
		tokenY = token.get("top")
		dist = Distance(targetToken,token,scale)
		if (dist > blastRadius) {continue}
		//check if LOS blocked (blast centre to token) and if blocked, dont add to arrays
		check = TargetIntersection(blastX,blastY,tokenX,tokenY)
		if (check != true) {continue}
		blastArray.push(token)
	}

	targets = blastArray.length 

	if (track) {
		track.set({playing: true,softstop:false})
	}

	for (let t=0;t<targets;t++) {
		let token = blastArray[t]
		let name = token.get("name")
		let char = getObj("character",token.get("represents"))
		damage = LethalDamage(targetToken,token,coverArray,scale,15)
		if (damage == "lethal") {
			results +=  name + " suffers lethal damage.^^"
		} else {
				armourText = Attribute(char,"armor_value").toString()
				targetArmour = Number(armourText.replace(/\D/g,''))
				if (isNaN(armour)) {armour = 0}
				targetaltArmourText = Attribute(char,"armor").toString()
				altArmour = Number(altArmourText.replace(/\D/g,''))	 //NPCs appear to have different titled value
				if (isNaN(altArmour)) {altArmour == 0}
				armour = Math.max(armour,altArmour)
				damage -= armour
				results +=  name + " takes " + damage + " damage.^^"
				results += DamageCheck(damage,char,token)
		}
	}

	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	rightsub = ""
	if (bonusOut == "") {bonusOut = "Nil^^"}


	if (weaponMod.includes("Luck") == false) {
			leftsub = " --leftsub|" 
			if (bracket == 1) leftsub += "Regular"
			if (bracket == 2) leftsub += "Hard"
			if (bracket == 3) leftsub += "Extreme"
			if (extraDice != 0) {
				if (extraDice < 0) {
					rightsub = " --rightsub|" + Math.abs(extraDice) + " Penalty Dice"
				}
				if (extraDice > 0) {
					rightsub = " --rightsub|" + extraDice + " Bonus Dice"
				}
			} 
			title = " --title|Roll: " + res[0] + "^^Range: " + range + " yds.^^Bonus/Penalty Dice:^^" + bonusOut 
			emote = " --emote|" + characterName + " throws a " + weaponName
			if (res[1] == "Failure") {
				emote += " and it scatters."
			} else if (res[1].includes("Success") || res[1].includes("Hit")) {
				emote += " and it lands on target."
			}
			powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
			powerCardTemplate += title
			powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)
			powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>",rightsub)
	}
	if (weaponMod.includes("Luck") == true) {
		leftsub = " --leftsub|Luck Used: " + finalLuck
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>",rightsub)
		emote = " --emote|A lucky bounce helps it land on target."

		if (weaponMod.includes("Misfire")) {
			emote = " --emote|Luckily the explosive fails to go off."
		}	else {
			powerCardTemplate += " --!A|" + results
		}
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
	
		newLuck = LuckAdjust(characterToken,finalLuck)
		powerCardTemplate += " --Luck Points left:|" + newLuck
		sendChat("",powerCardTemplate)
		return
	}

	if (bonusOut == "") {bonusOut = "Nil^^"}
	powerCardTemplate += " --!A|" + results

	if (characterType == "PC" && weaponMod.includes("Luck") == false ) {
		characterAmmo -= 1
		AttributeSet(character,weaponAmmo,characterAmmo)	
		powerCardTemplate += " --Ammunition Left:|" + characterAmmo
	}	

	if ((scatter == true || misfire == true) && characterType == "PC" && finalLuck > 0 && finalLuck <= characterLuck) {
		action = "!Cthulhu Blast " + characterTokenID + " " + targetTokenID + " " +originalWeaponName + " Luck"
		if (misfire == true) {action += ",Misfire"}
		action += " " + epiX + " " + epiY + " " + finalLuck 
		luckButton = luckButton.replace("<<LUCK>>",action)
		luckButton = luckButton.replace("<<FINAL>>",finalLuck)
		luckButton = luckButton.replace("<<SHOOTER>>",characterLuck)
		powerCardTemplate += luckButton
	}



	sendChat("",powerCardTemplate)

} //end Blast

if (Action == "Melee") {
	var targetTokenID = Tag[3]
	var weaponName = Tag[4]
	var weaponMod = Tag[5]
	var weaponInfo = WeaponInfo(weaponName)

//!Cthulhu Melee @{selected|token_id} 0 Dodge 0
	//using turn order, decide if primary attacker or fighting back
	var turnorder = (Campaign().get('turnorder')) ? JSON.parse(Campaign().get('turnorder')) : []
	chars = turnorder.length
	if (chars < 1) {return}
	curToken = getObj("graphic",turnorder[0].id)

	if (targetTokenID != "0") { // if is 0 then is a dodge
		var targetToken = findObjs({_type: "graphic", id: targetTokenID})[0]
		var targetCharacter = getObj("character",targetToken.get("represents"))
		var targetName = targetToken.get("name")
	}

	if (curToken == characterToken) { //is a primary attack, maneuvre or a withdrawal (dodge)

		state.PulpCthulhu = {
			attackerTokenID: characterTokenID,
			attackerWeapon: weaponName,
			attackerWeaponMod: weaponMod,
			targetID: targetTokenID,
			attackerType: characterType,
			attackerLuck: characterLuck,
		}

		if (targetToken) {
			if (targetToken.get("status_interdiction") == true) {
				out = "!Cthulhu Melee " + targetTokenID + " " + characterTokenID + " Helpless 0"
				sendChat("",out)
				return
			}
		}

		if (weaponMod == "Outnumber") {
			let sb = targetToken.get("status_blue")
			targetToken.set("status_blue",(sb+1))
		}

		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")

		if (weaponInfo.Special.includes("Dodge")) {
			powerCardTemplate += " --!A|" + characterName + " attempts to disengage from combat."
			powerCardTemplate += " --!B|Opponent(s) can try to oppose with a Maneuvre."
		} else if (weaponInfo.Special.includes("Maneuvre")) {
			powerCardTemplate += " --!A|" + characterName + " attempts a Maneuvre on " + targetName
			powerCardTemplate += " --!B|" + targetName + " should now decide on his defence."

		} else {
			powerCardTemplate += " --!A|" + characterName + " attacks " + targetName + " with a " + weaponName
			powerCardTemplate += " --!B|" + targetName + " should now decide on his defence."
		}

		sendChat("",powerCardTemplate)
		return
	} else { //run combat as this input is from defender

		var attackerTokenID = state.PulpCthulhu.attackerTokenID
		var attackerWeapon = state.PulpCthulhu.attackerWeapon
		var attackerWeaponMod = state.PulpCthulhu.attackerWeaponMod
		var targetID = state.PulpCthulhu.targetID
		var attackerType = state.PulpCthulhu.attackerType
		var attackerLuck = state.PulpCthulhu.attackerLuck

		if (targetID != characterTokenID && targetID != 0) {
			powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
			powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>","")
			powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
			powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
			powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
			powerCardTemplate += " --!A|" + characterName + " is not the character being attacked."
			sendChat("",powerCardTemplate)
			return	
		}

		var attackerToken = findObjs({_type: "graphic", id: attackerTokenID})[0]
		var attackerCharacter = getObj("character",attackerToken.get("represents"))
		var attackerName = attackerToken.get("name")

		var defenderToken = characterToken
		var defenderTokenID = characterTokenID
		var defenderCharacter = character
		var defenderName = characterName
		var defenderWeapon = weaponName
		var defenderWeaponMod = weaponMod
		var defenderType = characterType
		var defenderLuck = characterLuck

		var defenderMeleeAttacks = Attribute(defenderCharacter,"melee_attacks")
		if (defenderMeleeAttacks == 0) {defenderMeleeAttacks = 1}
		var defenderDefensesUsed = defenderToken.get("status_blue") //basically # of defenses used either as dodges or attack backs
		var	defenderOutnumber = false
		if (defenderDefensesUsed >= defenderMeleeAttacks) {
			defenderOutnumber = true
		}
		if (defenderDefensesUsed == false) {
			defenderToken.set("status_blue",1)
		} else {
			def = Number(defenderDefensesUsed) + 1
			defenderToken.set("status_blue",def)
		}

		//extra dice calculations (will be in format [extraDice,bonusOut] )
		attackerMods = MeleeDice(attackerToken,defenderToken,attackerWeapon,defenderOutnumber)
		attackerResult = MeleeResult(attackerCharacter,attackerWeapon,attackerMods[0])
		attackerBonusOut = attackerMods[1]
		if (attackerMods[0] == -100) {
			attackerResult = [-100,"Failure",101,0]
		} 

		defenderMods = MeleeDice(defenderToken,attackerToken,defenderWeapon,false)
		defenderResult = MeleeResult(defenderCharacter,defenderWeapon,defenderMods[0])
		defenderBonusOut = defenderMods[1]
		if (defenderMods[0] == -100) {
			defenderResult = [-100,"Failure",101,0]
		} 

		//compare results
		attackerWeaponInfo = WeaponInfo(attackerWeapon)
		soundFile = attackerWeaponInfo.Sound
		attackerTrack = findObjs({type:"jukeboxtrack", title: soundFile})[0]

		if (attackerTrack) {
			attackerTrack.set({playing: true,softstop:false})
		}
		defenderWeaponInfo = WeaponInfo(defenderWeapon)
		soundFile = defenderWeaponInfo.Sound
		defenderTrack = findObjs({type:"jukeboxtrack", title: soundFile})[0]

		if (defenderTrack) {
			defenderTrack.set({playing: true,softstop:false})
		}
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",attackerCharacter.id)	
		powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>","Combat Resolution")
		powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|" + attackerName)
		powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>"," --rightsub|" + defenderName)
		tokenTemplate = tokenTemplate.replace("<<SUBJECTTOK>>",attackerTokenID)
		tokenTemplate = tokenTemplate.replace("<<TARGETTOK>>",defenderTokenID)
		powerCardTemplate += tokenTemplate
		meleeTitle = " --title|" + attackerName + "^^" + attackerBonusOut + "^^Roll: " + attackerResult[0] + " / " + attackerResult[1]
		meleeTitle += "^^ ^^" + defenderName + "^^" + defenderBonusOut + "^^Roll: " + defenderResult[0] + " / " + defenderResult[1]

		if (attackerWeapon == "Fist") {
			attackerWeaponBit = " attacks using his fists"
			if (attackerBonusOut.includes("Opponent Prone")) {
				attackerWeaponBit = " kicks his prone opponent"
 			}
 		} else if (attackerWeapon.includes("Maneuvre")) {
 			attackerWeaponBit = " attempts a Maneuvre"
 		} else {
 			attackerWeaponBit = " attacks with his " + attackerWeapon.replace(/_/g," ")
 		}

 		if (defenderWeapon == "Fist") {
 			defenderWeaponBit = " attempts to fight back with his fists."
 		} else if (defenderWeapon.includes("Maneuvre")) {
 			defenderWeaponBit = " attempts to fight back with a Maneuvre."
 		} else if (defenderWeapon == "Helpless") {
 			defenderWeaponBit = " is helpless."
 		} else {
 			defenderWeaponBit = " attempts to fight back with his " + defenderWeapon.replace(/_/g," ") + "."
 		}

 		if (defenderWeapon == "Sword_of_Akmallah") {
 			 defenderWeaponBit = " parrys with the Sword of Akmallah!"
 		}




		if (attackerWeaponInfo.Special.includes("Dodge")) {	
			emote = attackerName + " tries to withdraw from the melee."
			powerCardTemplate += " --title|Withdraw Roll: " + attackerResult[0] + "^^Opposing Roll: " + defenderResult[0]
			//Dodge vs Maneuvre - is a withdraw - Attacker Results > Defender Results
			if (attackerResult[3] > defenderResult[3] || defenderWeapon == "Helpless") { // withdraws
				powerCardTemplate += " --!A|" + attackerName + " is able to withdraw from combat."
				finalLuck = defenderResult[2][attackerResult[3] - 1]
				if (defenderType == "PC" && defenderLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + defenderTokenID + " " + attackerTokenID + " " + finalLuck + " blockwithdraw"
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",defenderLuck)
					powerCardTemplate += luckButton
				} 
			} else { //stuck in combat
				powerCardTemplate += " --!A|" + defenderName + " keeps " + attackerName + " in melee."
				finalLuck = attackerResult[2][defenderResult[3]]
				if (attackerType == "PC" && attackerLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + attackerTokenID + " " + defenderTokenID + " " + finalLuck + " withdraw"
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",attackerLuck)
					powerCardTemplate += luckButton
				} 
			}
		} else if (defenderWeaponInfo.Special.includes("Dodge")) {
			emote = attackerName + attackerWeaponBit + " and " + defenderName + " attempts to dodge."
			//Attack/Maneuvre vs Dodge - Attacker Results > Defender Results
			if (attackerResult[3] > defenderResult[3]) { //Attacker Hits
				powerCardTemplate += MeleeDamage(attackerWeaponInfo,attackerResult,attackerToken,defenderToken,true)
				finalLuck = defenderResult[2][attackerResult[3] - 1]
				if (defenderType == "PC" && defenderLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + defenderTokenID + " " + attackerTokenID + " " + finalLuck + " dodge"
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",defenderLuck)
					powerCardTemplate += luckButton
				} 
			} else { //Defender Dodges
				powerCardTemplate += " --!A|" + defenderName + " dodges the attack."
				finalLuck = attackerResult[2][defenderResult[3]]
				if (attackerType == "PC" && attackerLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + attackerTokenID + " " + defenderTokenID + " " + finalLuck + " attacker " + attackerWeapon
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",attackerLuck)
					powerCardTemplate += luckButton
				} 
			}
		} else {
			emote = attackerName + attackerWeaponBit + " and " + defenderName + defenderWeaponBit
			//Attack/Maneuvre vs Fight Back/Maneuvre - Attacker results >= Defender Results
			if ((attackerResult[3] >= defenderResult[3] && attackerResult[3] > 0) || (defenderWeapon == "Helpless" && attackerResult > -1)) { //attacker success
				powerCardTemplate += MeleeDamage(attackerWeaponInfo,attackerResult,attackerToken,defenderToken,true)
				finalLuck = defenderResult[2][attackerResult[3]]
				if (defenderType == "PC" && defenderLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + defenderTokenID + " " + attackerTokenID + " " + finalLuck + " defender " + defenderWeapon
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",defenderLuck)
					powerCardTemplate += luckButton
				} 
			} else if (defenderResult[3] > 0 && defenderWeapon != "Helpless") { //defender success
				powerCardTemplate += MeleeDamage(defenderWeaponInfo,defenderResult,defenderToken,attackerToken,false)
				finalLuck = attackerResult[2][defenderResult[3] - 1]
				if (attackerType == "PC" && attackerLuck >= finalLuck) {
					action = "!Cthulhu MeleeLuck " + attackerTokenID + " " + defenderTokenID + " " + finalLuck + " attacker " + attackerWeapon
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuck)
					luckButton = luckButton.replace("<<SHOOTER>>",attackerLuck)
					powerCardTemplate += luckButton
				} 
			} else if (defenderWeapon == "Helpless" && attackerResult[3] < 0) {
				powerCardTemplate += " --!A|He is unable to land the blow/maneuvre."
			} else {
				powerCardTemplate += " --!A|Neither combatant is able to land a blow or complete a maneuvre."
				finalLuckA = attackerResult[2][0]
				finalLuckD = defenderResult[2][0]
				if (attackerType == "PC" && attackerLuck >= finalLuckA) {
					action = "!Cthulhu MeleeLuck " + attackerTokenID + " " + defenderTokenID + " " + finalLuckA + " attacker " + attackerWeapon
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuckA)
					luckButton = luckButton.replace("<<SHOOTER>>",attackerLuck)
					powerCardTemplate += luckButton
				} 
				if (defenderType == "PC" && defenderLuck >= finalLuckD) {
					action = "!Cthulhu MeleeLuck " + defenderTokenID + " " + attackerTokenID + " " + finalLuckD + " defender " + defenderWeapon
					luckButton = luckButton.replace("<<LUCK>>",action)
					luckButton = luckButton.replace("<<FINAL>>",finalLuckD)
					luckButton = luckButton.replace("<<SHOOTER>>",defenderLuck)
					powerCardTemplate += luckButton
				} 
			}
		}
		if (attackerResult[3] < 0) {
			powerCardTemplate += " --!F|" + attackerName + " stumbles and is now at a disadvantage."
			attackerToken.set("status_yellow",true)
			finalLuck = 10
			if (attackerType == "PC" && finalLuck <= attackerLuck) {
				action = "!Cthulhu MeleeLuck " + attackerTokenID + " " + defenderTokenID + " 10 fumble"
				luckButton = luckButton.replace("<<LUCK>>",action)
				luckButton = luckButton.replace("<<FINAL>>",finalLuck)
				luckButton = luckButton.replace("<<SHOOTER>>",attackerLuck)
				powerCardTemplate += luckButton
			}
		}
		if (defenderResult[3] < 0) {
			powerCardTemplate += " --!G|" + defenderName + " stumbles and is now at a disadvantage."
			defenderToken.set("status_yellow",true)
			finalLuck = 10
			if (defenderType == "PC" && finalLuck <= defenderLuck) {
				action = "!Cthulhu MeleeLuck " + defenderTokenID + " " + attackerTokenID + " 10 fumble"
				luckButton = luckButton.replace("<<LUCK>>",action)
				luckButton = luckButton.replace("<<FINAL>>",finalLuck)
				luckButton = luckButton.replace("<<SHOOTER>>",defenderLuck)
				powerCardTemplate += luckButton
			}
		} 




		powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
		powerCardTemplate += meleeTitle
		sendChat("",powerCardTemplate)
		return
	}
} //end Melee

if (Action == "MeleeLuck") {
	targetTokenID = Tag[3]
	targetToken = findObjs({_type: "graphic", id: targetTokenID})[0]
	finalLuck = Tag[4]
	reason = Tag[5]
	weapon = Tag[6]
	leftsub = " --leftsub|Luck Used: " + finalLuck

	powerCardTemplate += tokenTemplate
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)

	if (reason == "fumble") {
		powerCardTemplate += " --!Luck|Luckily the character recovers from his stumble at the last minute."
		characterToken.set("status_yellow",false)
	}

	if (reason == "blockwithdraw") {
		powerCardTemplate += " --!Luck|Luckily the character is able to keep his opponent in melee."
	}

	if (reason == "withdraw") {
		powerCardTemplate += " --!Luck|With a stroke of luck, the character is able to withdraw from melee."
	}

	if (reason == "dodge") {
		powerCardTemplate += " --!Luck|Luckily the character is able to dodge at the last moment."
	}

	if (reason == "attacker") {
		attackerWeaponInfo = WeaponInfo(weapon)
		powerCardTemplate += " --!Luck|Luck Intervenes!"
		powerCardTemplate += MeleeDamage(attackerWeaponInfo,1,characterToken,targetToken,true)
	}

	if (reason == "defender") {
		defenderWeaponInfo = WeaponInfo(weapon)
		powerCardTemplate += " --!Luck|Luck Intervenes!"
		powerCardTemplate += MeleeDamage(defenderWeaponInfo,1,characterToken,targetToken,true)
	}

	
	newLuck = LuckAdjust(characterToken,finalLuck)
	powerCardTemplate += " --Luck Points left:|" + newLuck
	sendChat("",powerCardTemplate)
	return
}

if (Action == "Skill") {
	skillName = Tag[3]
	difficulty = Tag[4]
	bonus = Tag[5]
	if (bonus) {
		bonus = Math.min(bonus,2)
		bonus = Math.max(bonus,-2)
	} else {
		bonus = 0
	}
	if (difficulty == "Regular") {difficultyLvl = 1}
	if (difficulty == "Hard") {difficultyLvl = 2}
	if (difficulty == "Extreme") {difficultyLvl = 3}
	skill = SKILL(character,skillName)
	skillCheck = skill + "-check"
	skillName = skillName.replace(/_/g," ")
	skillName = skillName.replace(/-/g," ")

	skillTestResult = Test(skill,bonus,difficultyLvl,false)
	finalLuck = 0
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|" + skillName)
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>"," --rightsub|" + difficulty)
	powerCardTemplate += " --title|Target: " + skill + "/" + Math.floor(skill/2) + "/" + Math.floor(skill/5) + "^^Roll: " + skillTestResult[0]
	if (bonus < 0) {
		powerCardTemplate += "^^Penalty: " + Math.abs(bonus) + " Dice." 
	}
	if (bonus > 0) {
		powerCardTemplate += "^^Bonus: " + bonus + " Dice."
	}
	if (skillTestResult[3] >= difficultyLvl) {
		powerCardTemplate += " --Result: " + skillTestResult[1] + "|"
		AttributeSet(character,skillCheck,"on")
		if (skillName == "First Aid") {
			healed = randomInteger(4)
			if (skillTestResult[3] > 2) {healed = 4}
			if (skillTestResult[0] == 1 ) {healed = 4 + randomInteger(4)}
			powerCardTemplate += " --Healing:| " + randomInteger(4) + " Wounds."
		}
	} else if (skillTestResult[3] == 0) {
		powerCardTemplate += " --Result: Failure|"
		finalLuck = skillTestResult[2][difficultyLvl-1]
	} else if (skillTestResult[3] < 0) {
		powerCardTemplate += " --Result: Fumble!|"
		if (skillName == "First Aid") {
			powerCardTemplate += " --Causing:| " + randomInteger(4) + " Wounds."
		}
	}

	if (skillTestResult[3] == 0 && characterType == "PC" && characterLuck >= finalLuck && skillName != "Luck" && skillTestResult[0] != 100 ) {
		action = "!Cthulhu SkillLuck " + characterTokenID + " " + finalLuck
		luckButton = luckButton.replace("<<LUCK>>",action)
		luckButton = luckButton.replace("<<FINAL>>",finalLuck)
		luckButton = luckButton.replace("<<SHOOTER>>",characterLuck)
		powerCardTemplate += luckButton
	}
	sendChat("",powerCardTemplate)
}


if (Action == "SkillLuck") {
	finalLuck = Tag[3]
	leftsub = " --leftsub|Luck Used: " + finalLuck

	powerCardTemplate += tokenTemplate
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>",leftsub)
	powerCardTemplate += " --Success:|In a stroke of luck, the character passes the Test!"
	newLuck = LuckAdjust(characterToken,finalLuck)
	powerCardTemplate += " --Luck Points left:|" + newLuck
	sendChat("",powerCardTemplate)
	return
}

if (Action == "RegainLuck") {
	roll = Number(randomInteger(100))
	if (roll<= characterLuck) {
		regain = Number(randomInteger(10) + 5)
	} else {
		regain = Number(randomInteger(10) + randomInteger(10) + 10)
	}
	newLuck = characterLuck + regain
	if (newLuck > 99) {
		regain = 99 - characterLuck
		newLuck = 99
	}
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Luck Regain")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate += " --title|Roll: " + roll
	powerCardTemplate += " --Regains:| " + regain + " Luck."
	powerCardTemplate += " --New Luck Total:| " + newLuck
	AttributeSet(character,"luck",newLuck) 
	sendChat("",powerCardTemplate)
}

if (Action == "ClearMarkers") {
	characterToken.set("statusmarkers","")
}

if (Action == "Bout") {
	subAction = Tag[3]
	roll = Number(randomInteger(10))
	altRoll = Number(randomInteger(10))	
	if (subAction == "Realtime") {
		if (roll == 1) {
			desc = " --Amnesia: |the hero ceases to think of him or herself as a hero, losing the ability to use his or her pulp talents for " + altRoll + " rounds."
		}
		if (roll == 2) {
			desc = " --Crazy Plan: |for " + altRoll + " rounds the hero pursues an irrational or ill-conceived plan. The plan must either benefit the enemy’s situation or increase the danger for the hero or his or her allies."
		}
		if (roll == 3) {
			desc = " --Rage: |a red mist descends on the hero and he or she explodes in a spree of uncontrolled violence and destruction directed at their surroundings, allies, or foes alike for " + altRoll + " rounds."
		}
		if (roll == 4) {
			desc = " --Gloat: |the hero is compelled to boast, gloat, or exclaim their plans aloud for " + altRoll + " rounds: &#34;So, before my friends and I wipe out every ghoul in this lair, just let me tell you this…&#34;"
		}
		if (roll == 5) {
			desc = " --Relax: |the hero is convinced that the threat is negligible, and he or she sits back and relaxes for " + altRoll + " rounds. They might take a minute to light a nice cigar or make a toast with a hip flask."
		}
		if (roll == 6) {
			desc = " --Flee in Panic: |the hero is compelled to get as far away as possible by whatever means are available, even if it necessitates them taking the only vehicle and leaving everyone else behind. They travel for " + altRoll + " rounds."
		}
		if (roll == 7) {
			desc = " --Show Off: |the hero becomes an attention-seeking maniac for " + altRoll + " rounds, possibly prone to foolhardy acts."
		}
		if (roll == 8) {
			desc = " --Alter Ego: |the hero’s personality undergoes a complete transformation and is replaced by one completely different for " + altRoll + " rounds. The alter ego is a mirror opposite of the hero. Where one is kind, the other is callous. Where one is selfish the other is altruistic."
		}
		if (roll == 9) {
			desc = " --Phobia: |the hero gains a new phobia. Roll 1D100 on the Sample Phobias Table (Chapter 9: Sanity, page 160, Call of Cthulhu Rulebook), or the Keeper may choose one. Even if the source of the phobia is not present, the investigator imagines it is there for the next " + altRoll + " rounds."
		}
		if (roll == 10) {
			desc = " --Mania: |the hero gains a new mania. Roll 1D100 on the Sample Manias Table (Chapter 9: Sanity, page 161, Call of Cthulhu Rulebook), or the Keeper may choose one. The investigator seeks to indulge in their new mania for the next " + altRoll + " rounds."
		}
	}
	if (subAction == "Summary") {
		if (roll == 1) {
			desc = " --Amnesia: |the hero comes to their senses in some unfamiliar place, with no memory of who they are and lacking any of their pulp talents. Their memories slowly return to them over time. Their pulp talents only return in a time of crisis. In this case, a crisis is defined as someone’s life being endangered. When someone’s life is threatened, the hero should make a Luck roll; if successful, their talents return. If unsuccessful they may try again in " + altRoll + " rounds."
		}
		if (roll == 2) {
			desc = " --Robbed: |the hero comes to their senses " + altRoll + " hours later, having been robbed. They are unharmed. If they were carrying a Treasured Possession (per their backstory), make a Luck roll to see if it was stolen. Everything else of value is automatically missing."
		}
		if (roll == 3) {
			desc = " --Battered: |the hero comes to their senses " + altRoll + " hours later to find themselves battered and bruised. Hit points are reduced to half of what they were before going insane. They have not been robbed. How the damage was sustained is up to the Keeper."
		}
		if (roll == 4) {
			desc = " --Violence: |the hero explodes in a spree of violence and destruction. When the hero comes to their senses, their actions may or may not be apparent or remembered. Who or what the hero has inflicted violence upon, and whether they have killed or only inflicted harm, is up to the Keeper."
		}
		if (roll == 5) {
			desc = " --Ideology/Beliefs: |review the hero’s backstory entry for Ideology and Beliefs. The hero manifests one of these in an extreme, crazed, and demonstrative manner. A common outcome is some variant of megalomania, whereby the hero’s talents and beliefs begin to corrupt their humanity and sense of right and wrong."
		}
		if (roll == 6) {
			desc = " --Significant People: |consult the hero’s backstory entry for Significant People and why the relationship is so important. In the time that passes (" + altRoll + " hours or more) the hero has done their best to get close to that person and act upon their relationship in some way."
		}
		if (roll == 7) {
			desc = " --Institutionalized or apprehended: |the hero comes to their senses in a high-security psychiatric ward or police cell. They may slowly recall the events that led them there."
		}
		if (roll == 8) {
			desc = " --Flee in panic: |when the hero comes to their senses, they are far away. They should be relocated somewhere appropriate and noteworthy, perhaps at the top of the Empire State Building, in the White House, or deep inside a military headquarters. How they reached the location is unknown to them."
		}
		if (roll == 9) {
			desc = " --Phobia: |the hero gains a new phobia. Roll 1D100 on the Sample Phobias Table (Chapter 9: Sanity, page 160, Call of Cthulhu Rulebook), or the Keeper may choose one. The hero comes to their senses " + altRoll + " hours later, having taken every precaution to avoid their new phobia."
		}
		if (roll == 10) {
			desc = " --Mania: |the hero gains a new mania. Roll 1D100 on the Sample Manias Table (Chapter 9: Sanity, page 161, Call of Cthulhu Rulebook), or the Keeper may choose one. The hero comes to their senses " + altRoll + " hours later. During this bout of madness, the hero will have been fully indulging in their new mania. Whether this is apparent to other people is up to the Keeper and player."
		}
	}
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>","")
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Bout of Madness")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>"," --rightsub|" + subAction)
	//powerCardTemplate += " --whisper|GM"
	powerCardTemplate += desc
	sendChat("",powerCardTemplate)
}

if (Action == "ShadowBox") {
	roll = randomInteger(100)
	part1 = Math.round(Attribute(character,"brawl")/5)
	part2 = Attribute(character,"cthulhu_mythos")
	tok = false
	if (roll <= part1 && roll <= part2 ) {
		desc = " --|Success. His Shadow separates and fights beside him for the duration of this combat."
		tok = true
	} else if (roll <= part1 || roll <= part2) {
		desc = " --|Partial Success. His Shadow separates, but only is able to stay in our dimension for " + randomInteger(4) + " round(s)."
		tok = true
	} else {
		desc = " --|Failure."
	}
	emote = characterName + "'s mind reaches beyond space and time and tries to separate his shadow."
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Shadow Box")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	powerCardTemplate += " --title|Roll: " + roll + " vs. " + part1 + "(Brawl) & " + part2 + "(Mythos)"
	powerCardTemplate += desc
	sendChat("",powerCardTemplate)

	if (tok == true) {
		newToken = createObj("graphic", {
			left: characterToken.get("left") + 70,
			top: characterToken.get("top"),
			width: 70,
			height: 70,
			name: "The Shadow",
			showname: true,
			showplayers_name: true,
			pageid: characterToken.get("pageid"),
			imgsrc: "https://s3.amazonaws.com/files.d20.io/images/271720970/6fYIad4fkbjAfMT0UUsq7w/thumb.png?1645298871",
			layer: "object",
			represents: "-MwIRwS3MVos2BTJMsBT"
		})
		track = findObjs({type:"jukeboxtrack", title: "Woosh"})[0]
		track.set({playing: true,softstop:false})	
	}




}

if (Action == "InsaneAccuracy") {
	emote = characterName + " exclaims 'It seems I just can't miss!', laughing crazily all the while."
	powerCardTemplate = powerCardTemplate.replace("<<EMOTE>>",emote)
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTID>>",character.id)	
	powerCardTemplate = powerCardTemplate.replace("<<SUBJECTNAME>>",characterName)
	powerCardTemplate = powerCardTemplate.replace("<<LEFTSUB>>"," --leftsub|Insane Accuracy Activated")
	powerCardTemplate = powerCardTemplate.replace("<<RIGHTSUB>>","")
	sendChat("",powerCardTemplate)
	characterToken.set("status_sentry-gun",true)
	track = findObjs({type:"jukeboxtrack", title: "TimmyLaugh"})[0]
	track.set({playing: true,softstop:false})		
}

if (Action == "Invisible") {	
	let aura = characterToken.get("aura1_color")
	if (aura == "#000000") {
		characterToken.set("aura1_radius","");
		characterToken.set("aura1_color","transparent");
	} else {
		characterToken.set("aura1_radius",1);
		characterToken.set("aura1_color","#000000");
	}
}






} //end of Cthulhu Script


