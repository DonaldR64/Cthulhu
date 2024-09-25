const AC = (() => {
    const version = "2024.9.19"

    if (!state.AC || state.AC == []) {state.AC = {}};

    let outputCard = {title: "",subtitle: "",player: "",body: [],buttons: [],};

    const pageInfo = {name: "",page: "",gridType: "",scale: 0,width: 0,height: 0};
    const rowLabels = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","AA","BB","CC","DD","EE","FF","GG","HH","II","JJ","KK","LL","MM","NN","OO","PP","QQ","RR","SS","TT","UU","VV","WW","XX","YY","ZZ","AAA","BBB","CCC","DDD","EEE","FFF","GGG","HHH","III","JJJ","KKK","LLL","MMM","NNN","OOO","PPP","QQQ","RRR","SSS","TTT","UUU","VVV","WWW","XXX","YYY","ZZZ"];


    let hexMap = {}; 
    let xSpacing = 75.1985619844599;
    let ySpacing = 66.9658278242677;

    const DIRECTIONS = ["Northeast","East","Southeast","Southwest","West","Northwest"];

    let CharacterArray = {}; //indexed on the tokenID for ease


    const simpleObj = (o) => {
        let p = JSON.parse(JSON.stringify(o));
        return p;
    };

    const getCleanImgSrc = (imgsrc) => {
        let parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)([^?]*)(\?[^?]+)?$/);
        if(parts) {
            return parts[1]+'thumb'+parts[3]+(parts[4]?parts[4]:`?${Math.round(Math.random()*9999999)}`);
        }
        return;
    };

    const SM = {
        prone: "status_Prone::2006547",



    }





    const ButtonInfo = (phrase,action) => {
        let info = {
            phrase: phrase,
            action: action,
        }
        outputCard.buttons.push(info);
    }

    const Factions = {
//later amend to include Black Sun, Heer, etc
        "PC": {
            "backgroundColour": "#0A2065",
            "titlefont": "Merriweather",
            "fontColour": "#FFFFFF",
            "borderColour": "#BC2D2F",
            "borderStyle": "5px groove",
        },
        "NPC": {
            "backgroundColour": "#0A2065",
            "titlefont": "Merriweather",
            "fontColour": "#FFFFFF",
            "borderColour": "#BC2D2F",
            "borderStyle": "5px groove",
        },




    }

    const HexInfo = {
        size: {
            x: 75.1985619844599/Math.sqrt(3),
            y: 66.9658278242677 * 2/3,
        },
        pixelStart: {
            x: 37.5992809922301,
            y: 43.8658278242683,
        },
        //xSpacing: 75.1985619844599,
        halfX: 75.1985619844599/2,
        //ySpacing: 66.9658278242677,
        width: 75.1985619844599,
        height: 89.2877704323569,
        directions: {},
    };

    const M = {
            f0: Math.sqrt(3),
            f1: Math.sqrt(3)/2,
            f2: 0,
            f3: 3/2,
            b0: Math.sqrt(3)/3,
            b1: -1/3,
            b2: 0,
            b3: 2/3,
    };

    class Point {
        constructor(x,y) {
            this.x = x;
            this.y = y;
        }
    };


    class Hex {
        constructor(q,r,s) {
            this.q = q;
            this.r =r;
            this.s = s;
        }

        add(b) {
            return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
        }
        subtract(b) {
            return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
        }
        static direction(direction) {
            return HexInfo.directions[direction];
        }
        neighbour(direction) {
            //returns a hex (with q,r,s) for neighbour, specify direction eg. hex.neighbour("NE")
            return this.add(HexInfo.directions[direction]);
        }
        neighbours() {
            //all 6 neighbours
            let results = [];
            for (let i=0;i<DIRECTIONS.length;i++) {
                results.push(this.neighbour(DIRECTIONS[i]));
            }
            return results;
        }



        len() {
            return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
        }
        distance(b) {
            return this.subtract(b).len() + 1;
        }
        round() {
            var qi = Math.round(this.q);
            var ri = Math.round(this.r);
            var si = Math.round(this.s);
            var q_diff = Math.abs(qi - this.q);
            var r_diff = Math.abs(ri - this.r);
            var s_diff = Math.abs(si - this.s);
            if (q_diff > r_diff && q_diff > s_diff) {
                qi = -ri - si;
            }
            else if (r_diff > s_diff) {
                ri = -qi - si;
            }
            else {
                si = -qi - ri;
            }
            return new Hex(qi, ri, si);
        }
        lerp(b, t) {
            return new Hex(this.q * (1.0 - t) + b.q * t, this.r * (1.0 - t) + b.r * t, this.s * (1.0 - t) + b.s * t);
        }
        linedraw(b) {
            //returns array of hexes between this hex and hex 'b'
            var N = this.distance(b);
            var a_nudge = new Hex(this.q + 1e-06, this.r + 1e-06, this.s - 2e-06);
            var b_nudge = new Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
            var results = [];
            var step = 1.0 / Math.max(N, 1);
            for (var i = 0; i < N; i++) {
                results.push(a_nudge.lerp(b_nudge, step * i).round());
            }
            return results;
        }
        label() {
            //translate hex qrs to Roll20 map label
            let doubled = DoubledCoord.fromCube(this);
            let label = rowLabels[doubled.row] + (doubled.col + 1).toString();
            return label;
        }

        radius(rad) {
            //returns array of hexes in radius rad
            //Not only is x + y + z = 0, but the absolute values of x, y and z are equal to twice the radius of the ring
            let results = [];
            let h;
            for (let i = 0;i <= rad; i++) {
                for (let j=-i;j<=i;j++) {
                    for (let k=-i;k<=i;k++) {
                        for (let l=-i;l<=i;l++) {
                            if((Math.abs(j) + Math.abs(k) + Math.abs(l) === i*2) && (j + k + l === 0)) {
                                h = new Hex(j,k,l);
                                results.push(this.add(h));
                            }
                        }
                    }
                }
            }
            return results;
        }
        angle(b) {
            //angle between 2 hexes
            let origin = hexToPoint(this);
            let destination = hexToPoint(b);

            let x = Math.round(origin.x - destination.x);
            let y = Math.round(origin.y - destination.y);
            let phi = Math.atan2(y,x);
            phi = phi * (180/Math.PI);
            phi = Math.round(phi);
            phi -= 90;
            phi = Angle(phi);
            return phi;
        }        
    };

    class DoubledCoord {
        constructor(col, row) {
            this.col = col;
            this.row = row;
        }
        static fromCube(h) {
            var col = 2 * h.q + h.r;
            var row = h.r;
            return new DoubledCoord(col, row);//note will need to use rowLabels for the row, and add one to column to translate from 0
        }
        toCube() {
            var q = (this.col - this.row) / 2; //as r = row
            var r = this.row;
            var s = -q - r;
            return new Hex(q, r, s);
        }
    };

    class Character {
        constructor(char,token) {
            let attributeArray = AttributeArray(char.id);
            let location = new Point(token.get("left"),token.get("top"));
            let hex = pointToHex(location);
            let hexLabel = hex.label();
            this.name = token.get("name");
            this.faction = attributeArray.faction || "PC";
            this.location = location;
            this.hex = hex;
            this.hexLabel = hexLabel;
            this.token = token;
            //abilities
            this.brawn = parseInt(attributeArray.brawn);
            this.coordination = parseInt(attributeArray.coordination);
            this.agility = parseInt(attributeArray.agility);
            this.insight = parseInt(attributeArray.insight);
            this.reason = parseInt(attributeArray.reason);
            this.will = parseInt(attributeArray.will);
            //skills
            this.fighting = parseInt(attributeArray.skill_fighting) || 0;
            this.academia = parseInt(attributeArray.skill_academia) || 0;

            //focuses
            this.hand =  (attributeArray.foc_hand_to_hand === "on") ? true:false;
            this.close = (attributeArray.foc_close_quarters === "on") ? true:false;
            this.melee = (attributeArray.foc_melee_weapons === "on") ? true:false;
            this.handguns = (attributeArray.foc_handguns === "on") ? true:false;
            this.rifles = (attributeArray.foc_rifles === "on") ? true:false;
            this.heavy = (attributeArray.foc_heavy_weapons === "on") ? true:false;
            this.exotic = (attributeArray.foc_exotic === "on") ? true:false;
            this.throwing = (attributeArray.foc_throwing === "on") ? true:false;
            this.occultism = (attributeArray.foc_occultism === "on") ? true:false;

            //bonus damage
            this.meleebonus = parseInt(attributeArray.brawn_bonus_dmg);
            this.rangedbonus = parseInt(attributeArray.insight_bonus_dmg);
            this.spellbonus = parseInt(attributeArray.will_bonus_dmg);





        }






    }





    const pointToHex = (point) => {
        let x = (point.x - HexInfo.pixelStart.x)/HexInfo.size.x;
        let y = (point.y - HexInfo.pixelStart.y)/HexInfo.size.y;
        let q = M.b0 * x + M.b1 * y;
        let r = M.b2 * x + M.b3 * y;
        let s = -q-r;
        let hex = new Hex(q,r,s);
        hex = hex.round();
        return hex;
    }

    const hexToPoint = (hex) => {
        let q = hex.q;
        let r = hex.r;
        let x = (M.f0 * q + M.f1 * r) * HexInfo.size.x;
        x += HexInfo.pixelStart.x;
        let y = (M.f2 * r + M.f3 * r) * HexInfo.size.y;
        y += HexInfo.pixelStart.y;
        let point = new Point(x,y);
        return point;
    }


    const getAbsoluteControlPt = (controlArray, centre, w, h, rot, scaleX, scaleY) => {
        let len = controlArray.length;
        let point = new Point(controlArray[len-2], controlArray[len-1]);
        //translate relative x,y to actual x,y 
        point.x = scaleX*point.x + centre.x - (scaleX * w/2);
        point.y = scaleY*point.y + centre.y - (scaleY * h/2);
        point = RotatePoint(centre.x, centre.y, rot, point);
        return point;
    }

    const XHEX = (pts) => {
        //makes a small group of points for checking around centre
        let points = pts;
        points.push(new Point(pts[0].x - 20,pts[0].y - 20));
        points.push(new Point(pts[0].x + 20,pts[0].y - 20));
        points.push(new Point(pts[0].x + 20,pts[0].y + 20));
        points.push(new Point(pts[0].x - 20,pts[0].y + 20));
        return points;
    }

    const Angle = (theta) => {
        while (theta < 0) {
            theta += 360;
        }
        while (theta > 360) {
            theta -= 360;
        }
        return theta
    }   

    const RotatePoint = (cX,cY,angle, p) => {
        //cx, cy = coordinates of the centre of rotation
        //angle = clockwise rotation angle
        //p = point object
        let s = Math.sin(angle);
        let c = Math.cos(angle);
        // translate point back to origin:
        p.x -= cX;
        p.y -= cY;
        // rotate point
        let newX = p.x * c - p.y * s;
        let newY = p.x * s + p.y * c;
        // translate point back:
        p.x = Math.round(newX + cX);
        p.y = Math.round(newY + cY);
        return p;
    }


    const BuildMap = () => {
        let startTime = Date.now();
        hexMap = {};
        //builds a hex map, assumes Hex(V) page setting
        let halfToggleX = HexInfo.halfX;
        let rowLabelNum = 0;
        let columnLabel = 1;
        //let xSpacing = 75.1985619844599;
        //let ySpacing = 66.9658278242677;
        let startX = 37.5992809922301;
        let startY = 43.8658278242683;

        for (let j = startY; j <= pageInfo.height;j+=ySpacing){
            let rowLabel = rowLabels[rowLabelNum];
            for (let i = startX;i<= pageInfo.width;i+=xSpacing) {
                let point = new Point(i,j);     
                let label = (rowLabel + columnLabel).toString(); //id of hex
                let hexInfo = {
                    id: label,
                    centre: point,
                    terrain: [],
                    tokenIDs: [],
                };
                hexMap[label] = hexInfo;
                columnLabel += 2;
            }
            startX += halfToggleX;
            halfToggleX = -halfToggleX;
            rowLabelNum += 1;
            columnLabel = (columnLabel % 2 === 0) ? 1:2; //swaps odd and even
        }


        let elapsed = Date.now()-startTime;
        log("Hex Map Built in " + elapsed/1000 + " seconds");
        //add tokens to hex map, rebuild Team/Unit Arrays
        BuildArrays();
    }


    const BuildArrays = () => {
        CharacterArray = {};
        //create an array of all tokens
        let start = Date.now();
        let tokens = findObjs({
            _pageid: Campaign().get("playerpageid"),
            _type: "graphic",
            _subtype: "token",
            layer: "objects",
        });

        let c = tokens.length;
        let s = (1===c?'':'s');     
        tokens.forEach((token) => {
            let char = getObj("character", token.get("represents"));
            if (char) {
                let character = new Character(char,token);
                CharacterArray[token.id] = character;
            }
        });


        let elapsed = Date.now()-start;
        log(`${c} token${s} checked in ${elapsed/1000} seconds - ` + Object.keys(CharacterArray).length + " placed in Character Array");        






    }

//set up as in feet
    const RangeBands = [
        50, //Close
        100, //Medium
        200, //Long
    ]

//maybe move to seperate script ala Battlegroup
    const Weapons = {
        "High Standard HDM Pistol": {
            type: "Ranged",
            focus: "handguns",
            range: 0, //close
            stress: 3,
            stresseffect: "",
            salvo: "Vicious",
            size: "Minor",
            qualities: "Close Quarters, Hidden",
        }








    }









    //Retrieve Values from Character Sheet Attributes
    const Attribute = (character,attributename) => {
        //Retrieve Values from Character Sheet Attributes
        let attributeobj = findObjs({type:'attribute',characterid: character.id, name: attributename})[0]
        let attributevalue = "";
        if (attributeobj) {
            attributevalue = attributeobj.get('current');
        }
        return attributevalue;
    };


    const LoadPage = () => {
        //build Page Info and flesh out Hex Info
        pageInfo.page = getObj('page', Campaign().get("playerpageid"));
        pageInfo.name = pageInfo.page.get("name");
        pageInfo.scale = pageInfo.page.get("scale_number");
        pageInfo.scaleUnits = pageInfo.page.get("scale_units");
        pageInfo.width = pageInfo.page.get("width") * 70;
        pageInfo.height = pageInfo.page.get("height") * 70;

        HexInfo.directions = {
            "Northeast": new Hex(1, -1, 0),
            "East": new Hex(1, 0, -1),
            "Southeast": new Hex(0, 1, -1),
            "Southwest": new Hex(-1, 1, 0),
            "West": new Hex(-1, 0, 1),
            "Northwest": new Hex(0, -1, 1),
        }
    }

    const AttributeArray = (characterID) => {
        let aa = {}
        let attributes = findObjs({_type:'attribute',_characterid: characterID});
        for (let j=0;j<attributes.length;j++) {
            let name = attributes[j].get("name")
            let current = attributes[j].get("current")   
            if (!current || current === "") {current = " "} 
            aa[name] = current;

        }
        return aa;
    };










    const SetupCard = (title,subtitle,faction) => {
        outputCard.title = title;
        outputCard.subtitle = subtitle;
        outputCard.faction = faction;
        outputCard.body = [];
        outputCard.buttons = [];
        outputCard.inline = [];
    }

    const PlaySound = (name) => {
        let sound = findObjs({type: "jukeboxtrack", title: name})[0];
        if (sound) {
            sound.set({playing: true,softstop:false});
        }
    };

    const DisplayDice = (roll,tablename,size) => {
        roll = roll.toString();
        if (!tablename) {
            tablename = "Neutral";
        }
        let table = findObjs({type:'rollabletable', name: tablename})[0];
        let obj = findObjs({type:'tableitem', _rollabletableid: table.id, name: roll })[0];        
        let avatar = obj.get('avatar');
        let out = "<img width = "+ size + " height = " + size + " src=" + avatar + "></img>";
        return out;
    };


    const PrintCard = (id) => {
        let output = "";
        if (id) {
            let playerObj = findObjs({type: 'player',id: id})[0];
            let who = playerObj.get("displayname");
            output += `/w "${who}"`;
        } else {
            output += "/desc ";
        }

        if (!outputCard.faction || !Factions[outputCard.faction]) {
            outputCard.faction = "NPC";
        }

        //start of card
        output += `<div style="display: table; border: ` + Factions[outputCard.faction].borderStyle + " " + Factions[outputCard.faction].borderColour + `; `;
        output += `background-color: #EEEEEE; width: 100%; text-align: center; `;
        output += `border-radius: 1px; border-collapse: separate; box-shadow: 5px 3px 3px 0px #aaa;;`;
        output += `"><div style="display: table-header-group; `;
        output += `background-color: ` + Factions[outputCard.faction].backgroundColour + `; `;
        //output += `background-image: url(` + Factions[outputCard.faction].image + `), url(` + Factions[outputCard.faction].image + `); `;
        output += `background-position: left,right; background-repeat: no-repeat, no-repeat; background-size: contain, contain; align: center,center; `;
        output += `border-bottom: 2px solid #444444; "><div style="display: table-row;"><div style="display: table-cell; padding: 2px 2px; text-align: center;"><span style="`;
        output += `font-family: ` + Factions[outputCard.faction].titlefont + `; `;
        output += `font-style: normal; `;

        let titlefontsize = "1.4em";

        if (outputCard.title.length > 12) {
            titlefontsize = "1em";
        }

        output += `font-size: ` + titlefontsize + `; `;
        output += `line-height: 1.2em; font-weight: strong; `;
        output += `color: ` + Factions[outputCard.faction].fontColour + `; `;
        output += `text-shadow: none; `;
        output += `">`+ outputCard.title + `</span><br /><span style="`;
        output += `font-family: Arial; font-variant: normal; font-size: 13px; font-style: normal; font-weight: bold; `;
        output += `color: ` +  Factions[outputCard.faction].fontColour + `; `;
        output += `">` + outputCard.subtitle + `</span></div></div></div>`;

        //body of card
        output += `<div style="display: table-row-group; ">`;

        let inline = 0;

        for (let i=0;i<outputCard.body.length;i++) {
            let out = "";
            let line = outputCard.body[i];
            if (!line || line === "") {continue};
            line = line.replace(/\[hr(.*?)\]/gi, '<hr style="width:95%; align:center; margin:0px 0px 5px 5px; border-top:2px solid $1;">');
            line = line.replace(/\[\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})\](.*?)\[\/[\#]\]/g, "<span style='color: #$1;'>$2</span>"); // [#xxx] or [#xxxx]...[/#] for color codes. xxx is a 3-digit hex code
            line = line.replace(/\[[Uu]\](.*?)\[\/[Uu]\]/g, "<u>$1</u>"); // [U]...[/u] for underline
            line = line.replace(/\[[Bb]\](.*?)\[\/[Bb]\]/g, "<b>$1</b>"); // [B]...[/B] for bolding
            line = line.replace(/\[[Ii]\](.*?)\[\/[Ii]\]/g, "<i>$1</i>"); // [I]...[/I] for italics
            let lineBack = (i % 2 === 0) ? "#D3D3D3" : "#EEEEEE";
            let fontColour = "#000000";
            let index1 = line.indexOf("%%");
            if (index1 > -1) {
                let index2 = line.lastIndexOf("%%") + 2;
                let substring = line.substring(index1,index2);
                let player = substring.replace(/%%/g,"");
                line = line.replace(substring,"");
                lineBack = Factions[player].backgroundColour;
                fontColour = Factions[player].fontColour;
            }    
            out += `<div style="display: table-row; background: ` + lineBack + `;; `;
            out += `"><div style="display: table-cell; padding: 0px 0px; font-family: Arial; font-style: normal; font-weight: normal; font-size: 14px; `;
            out += `"><span style="line-height: normal; color: ` + fontColour + `; `;
            out += `"> <div style='text-align: center; display:block;'>`;
            out += line + `</div></span></div></div>`;                
            
            output += out;
        }

        //buttons
        if (outputCard.buttons.length > 0) {
            for (let i=0;i<outputCard.buttons.length;i++) {
                let out = "";
                let info = outputCard.buttons[i];
                out += `<div style="display: table-row; background: #FFFFFF;; `;
                out += `"><div style="display: table-cell; padding: 0px 0px; font-family: Arial; font-style: normal; font-weight: normal; font-size: 14px; `;
                out += `"><span style="line-height: normal; color: #000000; `;
                out += `"> <div style='text-align: center; display:block;'>`;
                out += `<a style ="background-color: ` + Factions[outputCard.faction].backgroundColour + `; padding: 5px;`
                out += `color: ` + Factions[outputCard.faction].fontColour + `; text-align: center; vertical-align: middle; border-radius: 5px;`;
                out += `border-color: ` + Factions[outputCard.faction].borderColour + `; font-family: Tahoma; font-size: x-small; `;
                out += `"href = "` + info.action + `">` + info.phrase + `</a></div></span></div></div>`;
                output += out;
            }
        }

        output += `</div></div><br />`;
        sendChat("",output);
        outputCard = {title: "",subtitle: "",player: "",body: [],buttons: [],};
    }

    const ClearState = () => {
        state.AC = {
            momentum: 0,
            threat: 0,
        };
    }

    const Attack = (msg) => {
        //msg will have character info, weapon name, ? target info
        //also # of extra dice
        //calculate difficulty -> base 1, +1 if prone, +1 if certain marker (spells?)
        //roll against approp. stat
        //note rolls, any extra momentum or complications
        //roll damage 
        //can calculate final results

        //add in tooltips


        let Tag = msg.content.split(";");
        let attackerID = Tag[1];
        let defenderID = Tag[2];
        let weaponName = Tag[3]; 
        let bonusDice = parseInt(Tag[4]) || 0; //0 - 5?
        let roll;
        let difficulty = 1;


        let attacker = CharacterArray[attackerID];
        let defender = CharacterArray[defenderID];
        if (!attacker || !defender) {return};

        if (attacker === defender) {
            sendChat("","Targetted Self");
            return;
        }

        let weapon = Weapons[weaponName];
        if (!weapon) {return};

        let distance = TokenDistance(attacker,defender);
        let rangeBand = 3;
        for (let i=0;i<RangeBands.length;i++) {
            if (distance <= RangeBands[i]) {
                rangeBand = i;
                break;
            }
        }

        rangeMod = Math.abs(rangeBand - weapon.range);

        let stat,skill,weaponRange;
        switch(weapon.type) {
            case "Melee":
                statName = "Agility"; //for tooltip
                skillName = "Fighting";
                stat = attacker.agility;
                skill = attacker.fighting;
                if (distance >pageInfo.scale) {
                    sendChat("Not in Reach");
                    return;
                }
                break;
            case "Ranged":
                statName = "Coordination"; //for tooltip
                skillName = "Fighting";
                stat = attacker.coordination;
                skill = attacker.fighting;
                difficulty += rangeMod;
                break;
            case "Mental":
                statName = "Will"; //for tooltip
                skillName = "Academia";
                stat = attacker.will;
                skill = attacker.academia;
                //ranges

                break;
        }    

        let focus = attacker[weapon.focus] || false;
        let focusTarget = (focus === true) ? skill:1;

        let target = stat + skill;

        let diceNum = 2 + bonusDice;
        let attackRolls = [];
        let successes = 0;
        let complications = 0;

        //prone
        if (defender.token.get(SM.prone) === true) {
            if (distance/pageInfo.scale > 1) {
                difficulty++;
            } else {
                difficulty--;
            }
        }
        //other mods to difficulty eg. spells



        for (let i=0;i<diceNum;i++) {
            let roll = randomInteger(20);
            attackRolls.push(roll);
            if (roll === 20) {complications++};
            if (roll <= target) {successes++};
            if (roll <= focusTarget) {successes++};
        }

        attackRolls.sort();

        let bonusMomentum = successes - difficulty;
        bonusMomentum = bonusMomentum < 0 ? 0:bonusMomentum

        SetupCard(attacker.name,weaponName,"PCs");
        outputCard.body.push("Difficulty: " + difficulty);
        outputCard.body.push("Target: " + defender.name);
        outputCard.body.push("Rolls: " + attackRolls.toString() + " vs. " + target + "+");
        if (complications > 0) {
            let s = (complications > 1) ? "s": "";
            outputCard.body.push(complications + " Complication" + s);
        }
        if (successes < difficulty) {
            outputCard.body.push("Miss");
        } else {
            outputCard.body.push("Hit");
            if (bonusMomentum > 0) {
                outputCard.body.push("Bonus Momentum: " + bonusMomentum);
            }

            ButtonInfo("Roll Damage","!Damage;"+attackerID+";"+defenderID+";"+weaponName+";?{Momentum Spend|0};?{Salvo|No|Yes}");

        }

//highlight critical successes and complications
//maybe graphic represenations for d20?
//tooltip

//melee has different resutls - do oppossed rol
        //button for rolling damage if success


        PrintCard();




    }

    const Damage = (msg) => {
        //msg to have weapon name, and ask for added bonus eg. momentum spend
        let Tag = msg.content.split(";");
        let attackerID = Tag[1];
        let defenderID = Tag[2];
        let weaponName = Tag[3];
        let bonusDice = parseInt(Tag[4]) || 0;
        let salvo = Tag[5];
        salvo = (salvo === "Yes") ? true:false;
        bonusDice = (bonusDice > 3) ? 3:bonusDice; 
        let attacker = CharacterArray[attackerID];
        let defender = CharacterArray[defenderID];
        let weapon = Weapons[weaponName];
        let bonusDamage;
        switch(weapon.type) {
            case "Melee":
                bonusDamage = parseInt(attacker.meleebonus);
                break;
            case "Ranged":
                bonusDamage = parseInt(attacker.rangedbonus);
                break;
            case "Mental":
                bonusDamage = parseInt(attacker.spellbonus);
                break;
        }    
log(bonusDamage)

        let numDice = parseInt(weapon.stress) + bonusDamage + bonusDice;
        let stressRolls = [];
        let nmbrStress = 0;
        let nmbrEffects = 0;

        for (let i=0;i<numDice;i++) {
            roll = randomInteger(6);
            stressRolls.push(roll);
            switch(roll) {
                case 1:
                    nmbrStress += 1;
                    break;
                  case 2:
                    nmbrStress += 2;
                    break;
                  case 3:
                    break;
                  case 4:
                    break;
                  case 5:
                    nmbrStress += 1;
                    nmbrEffects += 1;
                    break;
                  case 6:
                    nmbrStress += 1;
                    nmbrEffects += 1;
                    break;
            }
        }
        stressRolls.sort();

        //flag here is effects does anything - check weapon
        effectsFlag = weapon.stresseffect ? true:false;

        SetupCard(weaponName,"Damage Results","PCs");
        outputCard.body.push("Rolls: " + stressRolls.toString()); //adjust to pics
        outputCard.body.push("Stress: " + nmbrStress);
        if (nmbrEffects > 0 && effectsFlag === true) {
            outputCard.body.push(nmbrEffects + " Effects Rolled");
            //and info on the effect
            switch(weapon.stresseffect) {
                case "Vicious":
                    outputCard.body.push("Vicious adds " + nmbrEffects + "  Stress");
                    outputCard.body.push("For a Total of " + (nmbrStress + nmbrEffects) + " Stress");
                    break;

            }  







        }
        if (salvo === true && weapon.salvo) {
            outputCard.body.push("[hr]");
            switch(weapon.salvo) {
                case "Vicious":
                    if (nmbrEffects > 0) {
                        outputCard.body.push("Salvo adds " + nmbrEffects + "  Stress");
                        outputCard.body.push("For a Total of " + (nmbrStress + nmbrEffects) + " Stress");
                    } else {
                        outputCard.body.push("No Effect from Salvo");
                    }
                    break;

            }            





            outputCard.body.push("One Ammo is consumed");
        }

        //damage resistance
        //less cover - for now leave this as a text note re cover




        PrintCard();

    }
    









    const TokenInfo = (msg) => {
        if (!msg.selected) {
            sendChat("","No Token Selected");
            return;
        };
        let id = msg.selected[0]._id;
        let character = CharacterArray[id];
        if (!character) {
            sendChat("","Not in Array Yet");
            return;
        };
        SetupCard(character.name,"Info",character.faction);
        outputCard.body.push("Hex: " + character.hexLabel);
        PrintCard();
    }


    const Distance = (msg) => {
        let Tag = msg.content.split(";");
        let attackerID = Tag[1];
        let defenderID = Tag[2];

        let attacker = CharacterArray[attackerID];
        let defender = CharacterArray[defenderID];

        

        sendChat("","Distance: " + TokenDistance(attacker,defender) + " " + pageInfo.scaleUnits);



    }


    const TokenDistance = (charA,charB) => {
        let dist = charA.hex.distance(charB.hex) * pageInfo.scale;
        return dist;
    }





    const handleInput = (msg) => {
        if (msg.type !== "api") {
            return;
        }
        let args = msg.content.split(";");
        log(args)
        switch(args[0]) {
            case '!Dump':
                log("STATE");
                log(state.AC);
                log("Char Array");
                log(CharacterArray)
                log("Page Info");
                log(pageInfo);
                break;
            case '!ClearState':
                ClearState();
                break;
            case '!Attack':
                Attack(msg);
                break;
            case '!Damage':
                Damage(msg);
                break; 
            case '!TokenInfo':
                TokenInfo(msg);
                break;
            case '!Distance':
                Distance(msg);
                break;
        }
    };

    const registerEventHandlers = () => {
        on('chat:message', handleInput);
        //on('change:graphic',changeGraphic);
    };

    on('ready', () => {
        log("==> Achtung! Cthulhu Version: " + version + " <==")
        LoadPage();
        BuildMap();
        sendChat("","API Ready")
        registerEventHandlers();
    });

    return {
        // Public interface here
    };















})();