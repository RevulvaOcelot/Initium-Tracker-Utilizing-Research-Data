    // ==UserScript==
    // @name         iTURD
    // @namespace    http://tampermonkey.net/
    // @version      1.69
    // @description  Now with more fiber!
    // @author       You
    // @match        http://www.playinitium.com/*
    // @match        https://www.playinitium.com/*
    // @grant        GM_setValue
    // @grant        GM_getValue
    // ==/UserScript==

    (function() {
        'use strict';
        // if(typeof messageCodes == "undefined") {
        //     return;
        // }
        var textFile = null;
        var in_battle = document.title == "Combat - Initium";
        if(in_battle) {
            $('.main-button').hide(); // Keep this line if you want to make sure that you don't attack too early. Attacking too early might botch your data. Comment it out if youn don't care since it slows you down a bit.
        }
        $(document).ready(function() {
            //Setup
            var cid = characterId || 0; // Character ID
            var statsHref = "https://www.playinitium.com/viewcharactermini.jsp?characterId=" + cid;
            var data = loadData();
            var character_data = getCharData(cid);
            // updateStats(character_data, {strength: 'loading...', dexterity: 'loading...', intelligence: 'loading...'}); // For default info while waiting for ajax.
            $('#PISSED-current-stats').html('Loading stats...');

            //Setup for Special tab
            tabSetup(messageCodes);
            
            addToTab("Info", "<span><span id='PISSED-attack-info'></span> | " + 
                "<span id='PISSED-current-stats'>Loading...</span>" +
                "</span>", "Special");

            addToTab("Info", "<span><span id='PISSED-hp-alarm-display'></span></span>", "Special");
            if(character_data.config.missingEquip === true) {
                addToTab("Info", "<span><span id='PISSED-missing-equip'>Loading...</span></span>", "Special");
            }
            addToTab("Actions", 
                "<input type='number' id='PISSED-hp-input' placeholder='0' style='width: 40px;' /> <a style='color: yellow;' id='PISSED-hp-alarm' href='#'>Change HP Alarm Threshold</a> - In percentage (e.g. 70 to alarm at <70%hp). Set to 0 to disable. ", "Special");

            addToTab("Actions", 
                "<a style='color: yellow;' id='PISSED-missing-equip-toggle' href='#'>Toggle Missing Equip Alert</a> - <i>Current: " + character_data.config.missingEquip + '</i>', "Special");

            //Add stat management controls
            addToTab("Actions", 
                "<a style='color: yellow;' id='PISSED-change-attack-index' href='#'>Change Attack Index</a> <input type='number' id='PISSED-new-attack-index' placeholder='0' style='width: 40px;' /> "            
                , "Data");
            // addToTab("Actions", 
                
            //     "<a style='color: yellow;' id='PISSED-reset-total-attacks' href='#'> Reset Total Attacks </a>"
            //     , "Data");

            //Add data management controls
            addToTab("Actions", 
                "<a style='color: yellow;' id='PISSED-reset-all-data' href='#'> Reset All Data </a> <a href='#'></a>"       
                , "Data");
            addToTab("Actions", 
                
                "<a style='color: yellow;' id='PISSED-reset-char-data' href='#'> Reset Character Data </a> <a href='#'></a>"        
                , "Data");
           addToTab("Actions", 
                
                "<a style='color: yellow;' id='PISSED-reset-config-data' href='#'> Reset Config Data </a> <a href='#'></a>"        
                , "Data");
           addToTab("Actions", 
                
                "<a style='color: yellow;' id='PISSED-reroll-button' href='#'> Reroll Character </a> <a href='#'></a>"        
                , "Data");

            //Exports

            addToTab("Actions", 
                '<a id="downloadAnchorElem" style="display:none"></a>' +
                "<a style='color: yellow;' id='PISSED-export-all-data' href='#'>Export All Data</a>", "Stats");

            addToTab("Actions", 
                "<a style='color: yellow;' id='PISSED-export-char-data' href='#'>Export Character Data</a>", "Stats");

            addToTab("Actions", 
                "<a style='color: yellow;' id='PISSED-export-stat-log' href='#'>Export Character Stats Log</a>", "Stats");

            //Warning
            if(in_battle) {
                // addToTab('NOTICE', 'Wait until page has loaded before attacking to avoid inconsistent data.', 'Special');
                // addToTab('NOTICE', 'Wait until page has loaded before attacking to avoid inconsistent data.', 'Data');
                // addToTab('NOTICE', 'Wait until page has loaded before attacking to avoid inconsistent data.', 'Stats');
            }

            
            //Alerts set early just in case
            if(hpDanger(character_data)) {
                var r = confirm("Your HP is low! Turn off HP alert?");
                if(r) {
                    character_data.config.hp = 0;
                }
            }


            //Events
            $("#Special_tab").on("click", function(e) {
                e.preventDefault();
                changeToTab("Special");
            });
            $("#Data_tab").on("click", function(e) {
                e.preventDefault();
                changeToTab("Data");
            });
            $("#Stats_tab").on("click", function(e) {
                e.preventDefault();
                changeToTab("Stats");
            });

            $("#PISSED-export-all-data").on("click", function(e) {
                e.preventDefault();
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
                var dlAnchorElem = document.getElementById('downloadAnchorElem');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", "data.json");
                dlAnchorElem.click();
            });

            $("#PISSED-export-char-data").on("click", function(e) {
                e.preventDefault();
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character_data));
                var dlAnchorElem = document.getElementById('downloadAnchorElem');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", "char.json");
                dlAnchorElem.click();
            });

            $("#PISSED-export-stat-log").on("click", function(e) {
                e.preventDefault();
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character_data.progression));
                var dlAnchorElem = document.getElementById('downloadAnchorElem');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", character_data.name+"stat" + character_data.attack_index + ".json");
                dlAnchorElem.click();
            });
            
            $('#PISSED-reset-all-data').on("click", function(e) {
                e.preventDefault();

                $(this).next().text("RESET");
                $(this).next().on("click", function() {
                    data = loadData();
                    data = {};
                    saveData(data);
                    character_data = getCharData(cid);
                    updateDisplay(character_data);
                    addToTab('NOTICE', 'All data has been reset.', 'Data');
                    $(this).html('');
                });
            });

            $('#PISSED-reset-char-data').on("click", function(e) {
                e.preventDefault();
                $(this).next().text("RESET");
                $(this).next().on("click", function() {
                    data = loadData();
                    delete data[character_data.id];
                    saveData(data);
                    character_data = getCharData(cid);
                    updateDisplay(character_data);
                    addToTab('NOTICE', 'Character data has been reset.', 'Data');
                    $(this).html('');
                });
            });


            $('#PISSED-reset-config-data').on("click", function(e) {
                e.preventDefault();
                $(this).next().text("RESET");
                $(this).next().on("click", function() {
                    character_data.config = configDefault();
                    saveChar(character_data);
                    updateDisplay(character_data);
                    addToTab('NOTICE', 'Config data has been reset.', 'Data');
                    $(this).html('');
                });
            });


            // $('#PISSED-reset-total-attacks').on("click", function(e) {
            //     e.preventDefault();
            //     character_data.total_attacks = 0;
            //     updateDisplay(character_data);
            //     addToTab('NOTICE', 'Total attacks has been reset.', 'Data');
            // });

            $('#PISSED-change-attack-index').on("click", function(e) {
                e.preventDefault();
                character_data.attack_index = $('#PISSED-new-attack-index').val();
                updateDisplay(character_data);
                addToTab('NOTICE', 'Attack index has been changed to ' + character_data.attack_index, 'Data');
            });
            $('#PISSED-reroll-button').on("click", function(e) {
                e.preventDefault();
                $(this).next().text("RESET");
                $(this).next().on("click", function() {
                    character_data = getCharData(cid);
                    deleteAndRecreateCharacter(character_data.name)
                });
                
            });
            $('#PISSED-hp-alarm').on("click", function(e) {
                e.preventDefault();
                var newthreshold = $('#PISSED-hp-input').val();
                if(newthreshold) {
                    character_data.config.hp = newthreshold;
                } else {
                    character_data.config.hp = 0;
                }
                saveChar(character_data);
                updateDisplay(character_data);
                addToTab('NOTICE', 'HP alarm threshold changed.', 'Special');
            });
            $('#PISSED-missing-equip-toggle').on("click", function(e) {
                e.preventDefault();
                if(character_data.config.missingEquip) {
                    character_data.config.missingEquip = !character_data.config.missingEquip;
                } else {
                    character_data.config.missingEquip = true;
                }
                saveChar(character_data);
                updateDisplay(character_data);
                addToTab('NOTICE', 'Missing equip alarm set to ' + character_data.config.missingEquip +'. Refresh to update.', 'Special');
                $('#PISSED-missing-equip-toggle').next().html("Current: " + character_data.config.missingEquip);
            });



            // No need to wait for Ajax to display stored data
            updateDisplay(character_data);

            // Begin Ajax for Stats Grab
            $.ajax(statsHref).complete(function(d) {
                var strength = $('div[name="strength"]', d.responseText).text().split(" ")[0];
                var dexterity = $('div[name="dexterity"]', d.responseText).text().split(" ")[0];
                var intelligence = $('div[name="intelligence"]', d.responseText).text().split(" ")[0];
                var stats = {strength: strength, dexterity: dexterity, intelligence:intelligence};
                if(character_data.config.missingEquip == true) {
                    var missingEquips = $(".main-item:contains('None')", d.responseText).text().split('None');
                    $('#PISSED-missing-equip').html('Unequipped : ');
                    $.each(missingEquips, function(i,e) {
                        $('#PISSED-missing-equip').append('<b style="color: red;"> ' + e.trim().split(':')[0] + '</b>');
                    });
                }

                updateStats(character_data, stats);

                character_data.estimated_max_str = getMax("str", character_data);
                character_data.estimated_max_dex = getMax("dex", character_data);
                character_data.estimated_max_int = getMax("int", character_data);
                saveChar(character_data);
                updateDisplay(character_data);

                if(in_battle) {
                    // addToTab('NOTICE', 'Data has finished loading.', 'Special');
                    // addToTab('NOTICE', 'Data has finished loading.', 'Data');
                    // addToTab('NOTICE', 'Data has finished loading.', 'Stats');
                }
                $.each(character_data.progression, function(k, v) {
                    addToTab("#"+k, "S:" + parseFloat(v.strength).toFixed(2) + " | D:" + parseFloat(v.dexterity).toFixed(2) + " | I:" + parseFloat(v.intelligence).toFixed(2), "Stats");
                });
                $('.main-button').show();

            });

            if(in_battle) {
                $('.main-button').on('click', function(e) {
                 e.preventDefault();

                 if(($(this).attr('shortcut') == 49) || ($(this).attr('shortcut') == 50)) {
                    character_data.attack_index = parseInt(character_data.attack_index) + parseInt(1, 10);
                    character_data.total_attacks = parseInt(character_data.total_attacks) + parseInt(1, 10);
                    saveChar(character_data);
                 }
              });
            }

        });
        

        // Functions:
        function getMax(stat, character_data) {
            if(stat == "str") {
                return getStats("str", character_data.progression[0].strength,  character_data.progression[character_data.attack_index].strength, character_data.attack_index);
            } else if (stat == "dex") {
                return getStats("dex", character_data.progression[0].dexterity,  character_data.progression[character_data.attack_index].dexterity, character_data.attack_index);
            } else if (stat == "int") {
                return getStats("int", character_data.progression[0].intelligence,  character_data.progression[character_data.attack_index].intelligence, character_data.attack_index);
            }
        }

        function hpDanger(cd) {
            //Return true if it's dangerous to fight
            var hp = $('#hitpointsBar').children('p').text();
            var hp_max = hp.split('/')[1];
            hp = hp.split('/')[0];
            if(hp <= hp_max * (cd.config.hp/100 )) {
                return true;
            }
            return false;
        }

        function makeTextFile(text) {
          var data = new Blob([text], {type: 'text/plain'});
          // If we are replacing a previously generated file we need to
          // manually revoke the object URL to avoid memory leaks.
          if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
          }
          textFile = window.URL.createObjectURL(data);
          return textFile;
        };

        function updateDisplay(character_data) {

            var s = character_data.strength;
            var ms = character_data.estimated_max_str;
            var d = character_data.dexterity;
            var md = character_data.estimated_max_dex;
            var i = character_data.intelligence;
            var mi = character_data.estimated_max_int;

            if((ms == null) || (md == null) || (mi == null)) {

            } else {

            ms = +ms.toFixed(2);
            md = +md.toFixed(2);
            mi = +mi.toFixed(2);
            }
            switch(character_data.attack_index) {
                case 2:
                    if(d >= 5.01) {
                        d = '<b style="color:green">5.05</b>';
                    }
                break;
                case 16:
                case 17:
                case 18:
                    if(s >= 5.10) {
                        s = '<b style="color:green">5.10</b>';
                    }
                    if(d >= 5.05) {
                        d = '<b style="color:green">5.05</b>';
                    }
                    if(i >= 5.01) {
                        i = '<b style="color:green">5.01</b>';
                    }
                break;
                case 50:
                    if(s >= 5.29) {
                        s = '<b style="color:green">5.10</b>';
                    }
                    if(d >= 5.14) {
                        d = '<b style="color:green">5.05</b>';
                    }
                    if(i >= 5.04) {
                        i = '<b style="color:green">5.01</b>';
                    }
                break;
                default:
                break;
            }
                
            
            $('#PISSED-current-stats').html("Stats: " +s + ' / ' + d + ' / ' + i + " | Est.Max: " + ms + ' / ' + md + ' / ' + mi );
            $('#PISSED-attack-info').text('Attack #' + character_data.attack_index);
            $('#PISSED-hp-alarm-display').html('<i>' + 'HP Alarm goes off when HP is below ' + character_data.config.hp + '%.' + (hpDanger(character_data) ? '<b style="color: red;"> DANGER </b>' : '') + '</i>' );
            // + ' | Total Attacks: ' + character_data.total_attacks + 
        }

        function loadData() {
            return JSON.parse(GM_getValue("PISSED_data01", JSON.stringify({})));
        }

        function getCharData(cid) {
            var data = loadData();
            var con = configDefault();
            var name = $('.hint').text();
            if(data[cid]) {
                return data[cid];
            }
            return {
                id: cid,
                name: name,
                strength: 5,
                dexterity: 5,
                intelligence: 5,
                progression: {
                    0: {
                        strength: 5, dexterity: 5, intelligence: 5
                    }
                },
                attack_index: 0,
                total_attacks: 0,
                config: con,
                estimated_max_str: 11,
                estimated_max_dex: 10,
                estimated_max_int: 10
            }
        }

        function configDefault() {
            return {
                hp: 0,
                missingEquip: true
            }
        }

        function updateStats(character_data, data) {
            // if(data == {}) {
            //     data.strength = character_data.strength;
            //     data.dexterity = character_data.dexterity;
            //     data.intelligence = character_data.intelligence;
            // }
            character_data.strength = data.strength;
            character_data.dexterity = data.dexterity;
            character_data.intelligence = data.intelligence;
            character_data.progression[character_data.attack_index] = { strength: data.strength, dexterity: data.dexterity, intelligence: data.intelligence };
            var d = loadData();
            d[character_data.id] = character_data;
            saveData(d);
        }

        function saveChar(character_data) {
            var d = loadData();
            d[character_data.id] = character_data;
            saveData(d);
        }

        function saveData(data) {
            GM_setValue("PISSED_data01", JSON.stringify(data));
        }

        function tabSetup(messageCodes) {
            messageCodes.push("Special");
            messageCodes.push("Stats");
            messageCodes.push("Data");
            var dcode = localStorage.getItem("DefaultChatTab", "Special");
            $("#chat_messages_GlobalChat").before('<div class="chat_messages" id="chat_messages_Special" style="display: block;"></div>');
            $("#chat_messages_Special").hide();
            $("#PrivateChat_tab").after('<a id="Special_tab" class="chat_tab">Special</a>');
            $("#chat_messages_Special").prepend('<div class="chatMessage-main" id="chatMessage-notice-Special"></div>')

            $("#chat_messages_GlobalChat").before('<div class="chat_messages" id="chat_messages_Data" style="display: block;"></div>');
            $("#chat_messages_Data").hide();
            $("#Special_tab").after('<a id="Data_tab" class="chat_tab">Data</a>');
            $("#chat_messages_Data").prepend('<div class="chatMessage-main" id="chatMessage-notice-Data"></div>')

            $("#chat_messages_GlobalChat").before('<div class="chat_messages" id="chat_messages_Stats" style="display: block;"></div>');
            $("#chat_messages_Stats").hide();
            $("#Data_tab").after('<a id="Stats_tab" class="chat_tab">Stats</a>');
            $("#chat_messages_Stats").prepend('<div id="chatMessage-notice-Stats" class="chatMessage-main"></div>')

            //More setup
            changeToTab(dcode);
        }


        function addToTab(label, mess, tab) {
        //Adds to the secret tab
        // Tabs are: Special Stats Data
            var addHtml  = '<div class="chatMessage-main"><span style="padding-left: 5px; color: yellow;">' + label + ': </span><span class="chatMessage-text"> '+mess+' </span></div>'; 
            if(label == 'ALERT') {
                $("#chat_messages_" + tab).prepend(addHtml);
            } else if(label == 'NOTICE') {
                $('#chatMessage-notice-' + tab).html('<span style="padding-left: 5px; color: yellow;">' + label + ': </span><span class="chatMessage-text"> '+mess+' </span>');
            } 
            else {
                $("#chat_messages_" + tab).append(addHtml);
            }
        }


        function changeToTab(code)
        // Just a copy of initium's tabchanger, minus the one unnecessary line
        {
            var chat_messages = $('.chat_messages');
            chat_messages.hide();
            
            $("#chat_input").attr("placeholder", "Super secret stuff.");
            
            messager.channel = code;
            $('#chat_messages_'+code).show();
            
            localStorage.setItem("DefaultChatTab", code);
            for(var i = 0; i<messageCodes.length; i++)
            {
                $("#"+messageCodes[i]+"_tab").removeClass("chat_tab_selected");
            }   
            
            $("#"+code+"_tab").addClass("chat_tab_selected");
        }

        // StatCalc stuff
        function getStats(stat, init, curr, hits) {       
                
                    var initial=parseFloat(init, 10);
                    var current=parseFloat(curr, 10);
                    var hits=parseFloat(hits, 10);
                    var stats;
                    var compmod;
                    if (initial==5) { compmod=0.005; } else { compmod=0; }
                    var diff=current-initial-compmod
                    var mod, modmax, modin;
                    var max, minmax;
                    var i, j, g;
                    
                        if (stat=="str") {
                            mod=0.0009954;
                            max=11;
                            modmax=0.0012947;
                            minmax=9;
                            modin=0.0000014965;
                        }
                        else if (stat=="dex") {
                            mod=0.00057334;
                            max=10;
                            modmax=0.00072171;
                            minmax=8;
                            modin=0.0000007418493;
                        }
                        else if (stat=="int") {
                            mod=0.0001414791;
                            max=10;
                            modmax=0.000199425;
                            minmax=8;
                            modin=0.0000002897295;
                        }   
                
                max=(evalmaxStats(initial, current, hits, diff, stats, mod, modmax, modin, max, minmax, i, j, g, initial)+evalminStats(initial, current, hits, diff, stats, mod, modmax, modin, max, minmax, i, j, g, initial))/2;

                return max; 
                    
                }
                    
            function evalmaxStats(initial, current, hits, diff, stats, mod, modmax, modin, max, minmax, i, j, g, init) {      
                    j=mod;
                    for (g=max; g>=minmax; g=g-0.01) {
                            initial=parseFloat(init, 10);
                            for (i=1; i<=hits; i++) {
                                stats=initial+(g-initial)*j;
                                initial=stats;

                                if (((Math.round(stats*100))/100)==current && i==hits) {
                                    return g;
                                }
                            }
                            j=j+modin;
                    }   
            }   
            
            
            function evalminStats(initial, current, hits, diff, stats, mod, modmax, modin, max, minmax, i, j, g, init) {      
                    j=modmax;
                    for (g=minmax; g<=max; g=g+0.01) {
                            initial=parseFloat(init, 10);
                            for (i=1; i<=hits; i++) {
                                stats=initial+(g-initial)*j;
                                initial=stats;

                                if (((Math.round(stats*100))/100)==current && i==hits) {
                                    return g;
                                }
                            }
                            j=j-modin;
                    }   
            }


    })();
