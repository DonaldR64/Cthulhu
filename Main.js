const AC = (() => {
    const version = "2024.9.19"

    if (!state.AC || state.AC == []) {state.AC = {}};

    let outputCard = {title: "",subtitle: "",player: "",body: [],buttons: [],};

    const ButtonInfo = (phrase,action) => {
        let info = {
            phrase: phrase,
            action: action,
        }
        outputCard.buttons.push(info);
    }

    const Players = {
        "UK": {
            "image": "https://s3.amazonaws.com/files.d20.io/images/330506939/YtTgDTM3q7p8m0fJ4-E13A/thumb.png?1677713592",
            "backgroundColour": "#0A2065",
            "titlefont": "Merriweather",
            "fontColour": "#FFFFFF",
            "borderColour": "#BC2D2F",
            "borderStyle": "5px groove",
            "dice": "UK",
        },
        "USA": {
            "image": "https://s3.amazonaws.com/files.d20.io/images/327595663/Nwyhbv22KB4_xvwYEbL3PQ/thumb.png?1676165491",
            "backgroundColour": "#006400",
            "titlefont": "Arial",
            "fontColour": "#000000",
            "borderColour": "#006400",
            "borderStyle": "5px double",
            "dice": "USA",
        },        






    }


    const Weapons = {
        "High Standard HDM Pistol": {
            focus: "Handguns",
            range: "Close",
            stress: "3",
            stresseffect: "",
            salvo: "Vicious",
            size: "Minor",
            qualities: "Close Quarters, Hidden",
        }








    }

















    const SetupCard = (title,subtitle,player) => {
        outputCard.title = title;
        outputCard.subtitle = subtitle;
        outputCard.player = player;
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

        if (!outputCard.player || !Players[outputCard.player]) {
            outputCard.player = "Neutral";
        }

        //start of card
        output += `<div style="display: table; border: ` + Players[outputCard.player].borderStyle + " " + Players[outputCard.player].borderColour + `; `;
        output += `background-color: #EEEEEE; width: 100%; text-align: center; `;
        output += `border-radius: 1px; border-collapse: separate; box-shadow: 5px 3px 3px 0px #aaa;;`;
        output += `"><div style="display: table-header-group; `;
        output += `background-color: ` + Players[outputCard.player].backgroundColour + `; `;
        output += `background-image: url(` + Players[outputCard.player].image + `), url(` + Players[outputCard.player].image + `); `;
        output += `background-position: left,right; background-repeat: no-repeat, no-repeat; background-size: contain, contain; align: center,center; `;
        output += `border-bottom: 2px solid #444444; "><div style="display: table-row;"><div style="display: table-cell; padding: 2px 2px; text-align: center;"><span style="`;
        output += `font-family: ` + Players[outputCard.player].titlefont + `; `;
        output += `font-style: normal; `;

        let titlefontsize = "1.4em";
        if (outputCard.title.length > 12) {
            titlefontsize = "1em";
        }

        output += `font-size: ` + titlefontsize + `; `;
        output += `line-height: 1.2em; font-weight: strong; `;
        output += `color: ` + Players[outputCard.player].fontColour + `; `;
        output += `text-shadow: none; `;
        output += `">`+ outputCard.title + `</span><br /><span style="`;
        output += `font-family: Arial; font-variant: normal; font-size: 13px; font-style: normal; font-weight: bold; `;
        output += `color: ` +  Players[outputCard.player].fontColour + `; `;
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
                lineBack = Players[player].backgroundColour;
                fontColour = Players[player].fontColour;
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
                out += `<a style ="background-color: ` + Players[outputCard.player].backgroundColour + `; padding: 5px;`
                out += `color: ` + Players[outputCard.player].fontColour + `; text-align: center; vertical-align: middle; border-radius: 5px;`;
                out += `border-color: ` + Players[outputCard.player].borderColour + `; font-family: Tahoma; font-size: x-small; `;
                out += `"href = "` + info.action + `">` + info.phrase + `</a></div></span></div></div>`;
                output += out;
            }
        }

        output += `</div></div><br />`;
        sendChat("",output);
        outputCard = {title: "",subtitle: "",player: "",body: [],buttons: [],};
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
                break;
            case '!ClearState':
                ClearState();
                break;



                
        }
    };

    const registerEventHandlers = () => {
        on('chat:message', handleInput);
        //on('change:graphic',changeGraphic);
    };

    on('ready', () => {
        log("==> Achtung! Cthulhu Version: " + version + " <==")
        sendChat("","API Ready")
        registerEventHandlers();
    });

    return {
        // Public interface here
    };















})();