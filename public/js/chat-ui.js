$(function(){
	
	var socket = io.connect("http://localhost:3000");
	var numberUsers = [];
	// id of user that is being private messaged
	var userToPM = undefined;
	var groupToChat = undefined; 
	var me = "";
	var myId = "";
	var groupChats = [];
	var groupChatCount = [];

	var privateChats = [];
	var privateChatCount = [];
	
	socket.on('socket connect', function(msg) {
		console.log(msg)
	});
	
	$('#choose-nickname').submit(function(e){
		e.preventDefault();
		var nick = $('#nickname').val();
		me = nick;
		socket.emit('choose nickname', nick, function(err){
			if (err) {
				$('#nick-error').text(err);
				$('#nickname').val('');
			} else {
				$('#nickname-container').hide();
				$('#chat-container').show();
			}
		});
	});

	socket.on('names', function(users) {
		displayUsers(users);
	});

	socket.on('new user', function(user) {
		displayUsers([user]);
	});
	
	socket.on('current user', function(user) {
		$("#welcome-container").removeClass('hide');
		$("#welcome-container span").html(user.nick);
		myId = user.id
	});
	
	
	
	function displayUsers(users){
		var html = '';
		for (var i = 0; i < users.length; i++) {
			if(users[i].nick != me){
				numberUsers.push(users[i]);
				html += '<div class="user" id="user' + users[i].id + '">' + users[i].nick + '<span class="hide"></span></div>';
			}
		}
		$('#users').append(html);
	    
	    $('.user').click(function(e){
	    	if (!userToPM) {
	    		$('#pm-col').show();
	    	}
		    var tmp = userToPM;
	    	
	    	userToPM = $(this).attr('id').substring(4);
	    	
	    	
	    	
	    	if(tmp != userToPM){
	    		$('#private-chat').html('');
	    	}
	    	var usr = parseInt(myId)+parseInt(userToPM);
			
			//remove counter from selected user and reset counter
			$(this).children('span').addClass('hide').html('')
			privateChatCount[usr] = 0;
			
			//display messages according to select user 
    		if(typeof privateChats[usr] != "undefined"){	
    			$('#private-chat').html('');
	    	
	    		privateChats[usr].forEach(function(d){
	    			displayPrivateChat(d.from, d.msg)
    			})	    		
	    	}
	    	
	    	$('#user-to-pm').html('<h2>' + $(this).text() + '</h2>');
	    });
	}

	socket.on('user disconnect', function(id){
		$('#user'+id).remove();
	});

    $('#send-message').submit(function(e){
        e.preventDefault();
        var msg = $('#new-message').val();
        socket.emit('message', msg);
        $('#new-message').val('');
    });

    socket.on('message', function(data){
    	displayMsg(data.msg, data.nick)
    });

    socket.on('load old msgs', function(docs){
    	for (var i = docs.length-1; i >= 0; i--) {
    		displayMsg(docs[i].msg, docs[i].nick);
    	}
    });

    function displayMsg(msg, nick){
    	var html = "<span class='msg'><strong>" + nick + ":</strong> " + msg;
    	$('#chat').append(html);
    }

    $('#send-pm').submit(function(e){
    	e.preventDefault();
    	msg = $('#new-pm').val();
    	var msgData = {msg: msg, userToPM: userToPM, msgFrom:myId};
    	socket.emit('private message', msgData);   		

   		msgData.from = me;
   		setPrivateMessageArray(userToPM, msgData)
    	
    	$('#new-pm').val('');
    });

    socket.on('private message', function(data){
    	//$('.user').trigger('click')
    	setPrivateMessageArray(data.user, data)
    });
    
    /*Function used for manage array 
     *which contains private message chating between users
     */
     
    function setPrivateMessageArray(othUser, data){
    
		var usr = parseInt(othUser) +  parseInt(myId)
    	
    	if(typeof privateChats[usr] != "undefined"){
    		privateChats[usr].push(data);
    	}
    	else{	    	
    		privateChats[usr] = [data];    		
    	}
    	
    	if(usr == (parseInt(userToPM) +  parseInt(myId)) ){
    		displayPrivateChat(data.from,data.msg) 
    	}
    	else{    		
    		if(typeof privateChatCount[usr] == "undefined"){
    			privateChatCount[usr] = 1;
    		}
    		else{    			
	    		privateChatCount[usr] = parseInt(privateChatCount[usr]) + 1;
    		}

    		if(privateChatCount[usr] > 0){    			
    			$("#user"+othUser+" span")
    			.removeClass('hide')
    			.html(privateChatCount[usr]);
    		
    		}
    		
    	}
    }
    
    /* Function used for display  
     * message in private chat container 
     */
    function displayPrivateChat(name,msg){
    	var html = "<span class='pMsg'><strong>" + name + ":</strong> " + msg;
    	$('#private-chat').append(html);
    }   
    
    
    /*below code for create group*/
    
    $("#createGroup").click(function(){
    	if(numberUsers.length < 1){
    		alert("No Other Members found for add in room.")
    	}
    	else{
    		
    		var html = "";
    		var tmp = [];
    		for(var i=0; i < numberUsers.length; i++){    			
    			if(tmp.indexOf(numberUsers[i].id) == "-1"){
	    			tmp.push(numberUsers[i].id)
		    		html += '<div class="user-group" id="user' + numberUsers[i].id + '">' + numberUsers[i].nick + '</span></div>';
		    	}
	    	}
	  
	  		$("#groupname-container").removeClass('hide');
	    	$("#existingUser").html(html)    		
			$('#chat-container').hide();
			
			$(".user-group").click(function(){
				var tmp = $(this)
				$(this).remove()
				$(tmp).addClass('added-group')				
				$("#newUser").append(tmp)
				
				$(".added-group").click(function(){
					var tmp = $(this)
					$(this).remove()
					$(tmp).removeClass('added-group')
					$("#existingUser").append(tmp)
				})
			})
    	}    	
    })
	
    /* Submit request on server for add new group */
    $('#create-group').submit(function(e){
		e.preventDefault();
		
		/*check if any user selected or not for group*/
		
		if($("#newUser").children('div').length == 0){
			alert("Please select user for group")
		}
		else{
			var groupname = $('#groupname').val();
			$('#groupname').val('')
			var users = [];
			
			users.push(myId)
			
			$("#newUser").children('div').each(function(i,d){
				users.push(parseInt($(d).attr('id').split('user')[1]))
			})
			
			socket.emit('create group', {groupName :groupname, users:users}, function(err){
				if (!err) {
					$("#groupname-container").addClass('hide');	    			
					$('#chat-container').show();
					$("#newUser").html('')
				}
				else{
					alert("Error in crate group")
				}
			});
		}
	});
	
	/* if new group added in which
	 * user added then alert to user
	 */
	socket.on('new group', function(data){    	    	
    	displayGroups([data])
    });    
    
    /* Function used for display  
     * group message among all users
     */
    function displayGroups(group){
		var html = '';
		for (var i = 0; i < group.length; i++) {
				html += '<div class="group" id="group' + group[i].id + '">' + group[i].group + '<span class="hide"></span></div>';
			
		}
		
		$('#groups').append(html);
		
		 $('.group').click(function(e){
		 
	    	$("#chat-group").removeClass('hide')
	    	tmp = groupToChat;
	    	groupToChat = $(this).attr('id').substring(5);
	    	
	    	if(tmp != groupToChat){
	    		$('#group-chat').html('');
	    	}
	    	
	    	//remove counter from selected user and reset counter
			$(this).children('span').addClass('hide').html('')
			groupChatCount[groupToChat] = 0;
	    	
    		if(typeof groupChats[groupToChat] != "undefined"){	
    			
    			$('#group-chat').html('');
	    		
	    		groupChats[groupToChat].forEach(function(d){
	    			displayGroupChat(d.from, d.msg)
    			})	    		
	    	}	    	
	    
	    	$('#group-users').html('<h2>' + $(this).text() + '</h2>');
	   });
	}
	
	/*Below code for send and recieve group message*/
	
	$('#send-message-group').submit(function(e){
    	e.preventDefault();
    	msg = $('#new-message-group').val();
    	socket.emit('group message', {msg: msg, groupToChat: groupToChat,from:me});   		
   		
    	$('#new-message-group').val('');
    });

    socket.on('group message', function(data){    	
    	//$('.user').trigger('click')
    	if(typeof groupChats[data.groupId] != "undefined"){
    		groupChats[data.groupId].push(data);
    	}
    	else{	    	
    		groupChats[data.groupId] = [data];    		
    	}
    	
    	if(data.groupId == groupToChat){
    		displayGroupChat(data.from,data.msg)
    	}
    	else{
    		
    		if(typeof groupChatCount[data.groupId] == "undefined"){
    			groupChatCount[data.groupId] = 1;
    		}
    		else{    			
	    		groupChatCount[data.groupId] = parseInt(groupChatCount[data.groupId]) + 1;
    		}

    		if(groupChatCount[data.groupId] > 0){    			
    			$("#group"+data.groupId+" span")
    			.removeClass('hide')
    			.html(groupChatCount[data.groupId]);
    		
    		}
    	}
    	
    });
 
 	function displayGroupChat(name,msg){
    	var html = "<span class='pMsg'><strong>" + name + ":</strong> " + msg;
    	$('#group-chat').append(html);
    }  

});