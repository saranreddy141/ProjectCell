var mysql = require('mysql');
var express = require('express');

var bodyParser = require('body-parser');
var path = require('path');
	var upload = require('express-fileupload');
var moment = require('moment');
var uuid = require('uuid');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require("path");
var pdf = require("html-pdf");
var ejs = require("ejs");
var socketIo=require("socket.io");




var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'dbms',
	dateStrings: true,
	database : 'project'
});

var app=express();

app.use(cookieParser());
app.use(flash());
app.use(upload());
app.use( express.static( "./views/uploads/" ) );
app.use( express.static( "./views/faculty/" ) );
app.use( express.static( "./views/notification/" ) );
app.use( express.static( "./views/css/" ) );
app.use( express.static( "./views/student/" ) );
app.use( express.static( "./views/js/" ) );
app.locals.moment=require('moment');

var http=require("http");
var server = http.createServer(app)

var io=socketIo(server);
var session = require('express-session')({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
});

var sharedsession = require("express-socket.io-session");
app.use(session);

io.use(sharedsession(session));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.set('view engine','ejs');

app.get('/', function(request, response) {
	if(request.session.loggedin) {
			response.redirect('/home');
	} else {
		console.log("hai");
		connection.query("select * from notification",function (err,result) {
			if(err){

				throw err;
			}
			response.render('login',{print:result,error: request.session.error});
			request.session.destroy();
		});
	}
});



app.post('/attachment',function(req,res){
    var id=req.body.id;

    connection.query("select attachment from notification where id = ?",id ,function (err, result) {
      if (err){
				throw err;
			}
      else{

        res.download('./views/notification/'+result[0].attachment);

      }

    });
  });


	app.get('/logout', function(request, response) {
			request.session.loggedin=false;
			request.session.username=undefined;
			response.redirect('/');
	});

var data={};
app.post('/', function(request, response,next) {
	var username = request.body.username;
	var password = request.body.password;

	if (username && password) {
		connection.query('SELECT * FROM student WHERE id = ? AND password = ?', [username, password], function(error, results) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				request.session.userid = results[0].username;
				console.log("hai "+request.session.username);
					console.log(request.session.userid);
					console.log('student');

						response.redirect('/home');
				// else if(results[0].type == 'admin'){
				// 	console.log('admin');
				// 	response.redirect('/adminhome');
				// }
				// else{
				// 	console.log('faculty');
				// }
			}
		  else {
				request.session.error = 'Incorrect username or password';
				response.redirect('/');

			}
			response.end();
		});
	}
	// else {
	// 	request.session.error = 'Incorrect username or password';
	// 	response.redirect('/');
	// 	response.end();
	// }
});


//to genarating pdf for project form




// // -----------------admin pages-----------------------------------------------------
// app.get('/adminhome',function (request,response){
// 	connection.query("select * from notification", function (err, result) {
// 		if (err){ throw err;}
// 		else{
// 			noti={print: result};
// 			}
// 		});
// 	response.render('adminhome',noti);
// });
//
// app.post('/adminhome',function (req,res) {
// 	var notifi=req.body.notif;
// 	var admin='HOD';
// 	var date=new Date();
// 	var mm=date.getMonth()+1;
// 	var data=date.getFullYear()+'-'+mm+'-'+ date.getDate();
// 	connection.query("insert into notification (sended,date,msg,end_date) values ('"+admin+"','"+data+"','"+notifi+"','"+data+"')",function (err,result) {
// 		if(err){
// 			throw err;
// 		}
// 		else{
// 			res.render('adminhome',noti);
// 		}
// 	});
// });
//
// var student={};
// var type='student';
// app.get('/adminvstudents',function (req,res) {
// 	connection.query("select * from student where type = '"+type+"'",function (err,result) {
// 		if(err){
// 			throw err;
// 		}
// 		student={student : result};
// 		res.render('adminvstudents',student);
// 	});
//
// });
//
// app.post('/Delete',function (req,res) {
// 		var id=req.body.id;
// 		connection.query("delete from student where id='"+id+"'",function (err,result) {
// 			if(err){
// 				throw err;
// 			}else{
// 				console.log(id);
// 				res.render('adminvstudents',student);
// 		}
// 		});
// });
//
//
// var faculty={};
// var type1='faculty';
// app.get('/adminvfaculty',function (req,res) {
// 	connection.query("select * from student where type = '"+type1+"'",function (err,result) {
// 		if(err){
// 			throw err;
// 		}
// 		faculty={faculty : result};
// 		res.render('adminvfaculty',faculty);
// 	});
//
// });


//------------------------------- user web pages---------------------------

//user home page for friend request

app.get('/home', function(request, response) {

	if (request.session.loggedin) {

		connection.query("select * from student where id = ?",[request.session.username],function (err,result) {
		 if(err){
			 throw err;
		 }
		 else{
			 data=result;
			 console.log(data);
		 }
	 });
		 connection.query("select * from request where recieved = ? and status='pending'",[request.session.username],function (err,result) {
		 	if(err){

				throw err;
		 	}
			console.log(result.length);
			connection.query("select * from projectinfo where pid IN(select pid from projectinfo where id= ?)",[request.session.username],function(err,resul){
				if(err){
					throw err;
				}
				response.render('home',{print:result,masg:request.flash('msg'),printing:resul,name:request.session.userid,detials:data});
			});




		});

	} else {
		response.redirect('/');
	}
});

app.post('/accept',function (req,res) {

	if(req.session.loggedin) {
						console.log("i am in accept");
						var id=req.body.id;
						var id1=req.body.id1;
						var id2=req.body.id2;
						var gid=req.body.gid;
						console.log(id);
						console.log(id2);
						connection.query("select * from projectinfo where id ='"+id+"' or id IN(select id from projectinfo where id='"+id2+"' and tcount>4)",function(err,results){
							if(err){
								throw err;
							}
							console.log("select project");
							connection.query("select * from faculty where id ='"+gid+"'",function(err,result){
									if(err){
										throw err;
									}
									console.log("select faculty");
									console.log(results.length);
									console.log(result[0].count);
									var count=result[0].count;
										if(results.length > 0 || result[0].count < 1 ){
											connection.query("update request set status = 'rejected' where  recieved = '"+id+"' ",function (err,result) {
													if(err){
														throw err;
													}
													console.log('successfully updated in request rejected');
											});
											req.flash('msg','reject');
											res.redirect('/home');
										}
										else{
											var tcount=1;
											connection.query("select * from projectinfo where id ='"+id2+"'",function (err,res) {
												if(err){
													throw err;
												}
												tcount=res[0].tcount;
												console.log(tcount);
											});
											console.log(id2);
											console.log(tcount);
											connection.query("select * from request where id='"+id1+"'", function (err,resul) {
												if(err){
													throw err;
												}
											tcount++;
												connection.query("insert into projectinfo (id,name,guideid,guidename,pid,tcount) values('"+resul[0].recieved+"','"+req.session.userid+"','"+resul[0].guideid+"','"+resul[0].guidename+"','"+resul[0].pid+"','"+tcount+"')",function (err,result) {
													if(err){
														throw err;
													}

													count--;
													connection.query("update faculty set count='"+count+"' where id='"+resul[0].guideid+"'",function (err,result) {
														if(err){
															console.log("error occured updating faculty page 325");
															throw err;
														}
													});
													connection.query("update projectinfo set tcount = '"+tcount+"' where  pid = '"+resul[0].pid+"' ",function (err,result) {
															if(err){
																throw err;
															}
															console.log('successfully updated in projectinfo');
													});
													connection.query("update request set status = 'rejected' where  recieved = '"+id+"' ",function (err,result) {
															if(err){
																throw err;
															}
															console.log('successfully updated in request rejected');
													});
													connection.query("update request set status = 'accepted' where  id = '"+id1+"' ",function (err,result) {
															if(err){
																throw err;
															}
															console.log('successfully updated in request rejected');
													});

													connection.query("update student set pid = '"+resul[0].pid+"' where id = '"+req.session.username+"' ",function (err,result) {
															if(err){
																throw err;
															}
															console.log('successfully inserted in student');
													});

												});
											});
											req.flash('msg','success');
											return res.redirect('/home');

										}


								});
						 });


		}else {
			res.redirect('/');
		}
});


app.post('/reject',function (req,res) {
	if(req.session.loggedin) {
			var id=req.body.id;
			console.log(id);
			connection.query("update request set status = 'rejected' where  id = '"+id+"' ",function (err,result) {
					if(err){
						throw err;
					}

					console.log('successfully updated in request rejected');
			});
			req.flash('msg','reject');
			res.redirect('/home')
		}else {
			res.redirect('/');
		}
});


var html = fs.readFileSync('./views/home.ejs', 'utf8');
var options = {format: 'Letter'	};



app.get('/generateReport',function (req,res) {
	if(req.session.loggedin) {
	connection.query("select * from projectinfo where pid IN(select pid from projectinfo where id= ?)",[req.session.username],function(err,resul){
		if(err){
			throw err;
		}
				// ejs.renderFile(path.join(__dirname, './views/pdf.ejs'), {printing: resul,guide:resul[0].guidename},(err, data) => {
				// 				if (err) {
				// 					res.send(err);
				// 				} else {
				// 						pdf.create(data, options).toFile("projectform.pdf", function (err, data) {
				// 								if (err) {
				// 									console.log('console;');
				// 										res.send(err);
				// 								} else {
				// 										res.send("File created successfully");
				// 								}
				// 						});
				//
				// 						// pdf.create(html, {format: 'Letter', orientation: 'landscape'}).toStream(function(err, stream){
			 	// 						// 	stream.pipe(fs.createWriteStream('certificate.pdf'));
				// 						// });
				// 					}
				// 					});
				if(resul.length>0){

				res.render('pdf',{printing: resul,guide:resul[0].guidename});
			}else{
				res.redirect('/home');
			}
					});
				}else {
					res.redirect('/');
				}

});


app.get('/sendfriendrequest',function (req,res) {
	if(req.session.loggedin) {
		connection.query("select * from student where id not in(select id from projectinfo)",function(err,result){
			if(err){
				throw err;
			}
			else{
				if(result.length>0){
					res.render('sendfriendrequest',{print:result,masg:req.flash('msgg')});}
			}
		})
	}else {
		res.redirect('/');
	}

});

app.post('/sendfriendrequesting',function (req,res) {
	if(req.session.loggedin) {
			var id=req.body.id;
			console.log("hai ohoafafafa");
			connection.query("select * from projectinfo where id ='"+req.session.username+"'",function(err,result){
				if(err){
					throw err;
				}
				else{
					console.log(result[0].pid);
					connection.query("insert into request(sended,recieved,status,pid,guidename,guideid) values('"+req.session.username+"','"+id+"','pending','"+result[0].pid+"','"+result[0].guidename+"','"+result[0].guideid+"') ",function (err,resul) {
						if(err){
							throw err;
						}else {
							req.flash('msgg','Successfully Sended friendrequest');
							res.redirect('/sendfriendrequest');
						}

					});
				}
			});

	}else {
		res.redirect('/');
	}

});


// chat pages

io.on("connection",function(socket){
	console.log("userconncted");
	var datetime = new Date();

	console.log(socket.handshake.session.userid);

	io.emit('newMessage',{senderid:'admin',text:'Welcome to the chat app',time : datetime.toISOString().slice(11,16)});

	socket.broadcast.emit('newMessage',{senderid:'admin',text:'new use joined',time : datetime.toISOString().slice(11,16)});

    console.log(datetime.toISOString().slice(11,16));

	socket.on('createmessage',function(message){

		console.log(message);
		console.log(message.gid);
		console.log(message.text);

		io.emit('newMessage',{senderid:socket.handshake.session.userid,text:message.text,time : datetime.toISOString().slice(11,16)});
		connection.query("insert into messages(senderid,groupid,message,time,sendername) values('"+socket.handshake.session.username+"','"+message.gid+"','"+message.text+"','"+datetime.toISOString().slice(11,16)+"','"+socket.handshake.session.userid+"')",function(err,result){
			if(err){
				throw err;
			}
		});
	});
});


app.get('/chat',function(req,res){
	if(req.session.loggedin) {
		connection.query("select * from projectinfo where id='"+req.session.username+"'",function(err,resutl){
			if(err){
				throw err;
			}
			else{
			connection.query("select * from messages where groupid ='"+resutl[0].pid+"'",function(err,resul){
				if(err){
					throw err;
				}
				else{

					res.render('chat',{print:resul,groupid:resutl[0].pid});

				}
			});
		}

		});

	}else{
		res.redirect('/');
	}
})








// studentRegistration page


app.get('/studentRegistration',function (req,res) {
	if(req.session.loggedin) {
			connection.query("select * from faculty",function (err,result) {
				if(err){

					throw err;
				}else {
					console.log("faculty");
					console.log(result.length);
					var asd=req.flash('fresult');
					console.log(asd);
					console.log(asd.length);
					console.log(req.flash('fresult'));
					connection.query("select * from projectinfo where id='"+req.session.username+"'",function(err,resul){
						if(err){
							throw err;
						}
							res.render('studentRegistration',{print:result,msg:asd,student:resul});
					});

					}
			});
		}else {
			res.redirect('/');
		}

});


app.post('/studentreg',function (req,res) {

			var id=req.body.facultyid;
			var name =req.body.facultyname;
			var count =req.body.count;
			console.log(id);
			console.log("name"+name);
			res.render('projectReg',{sid:req.session.username,id1 :id,name1:name,count :count});

});

//student Results pages
app.get('/studentResults',function(req,res){
	if(req.session.loggedin){
		res.render('studentResults',{detials:data});
	}else{
		res.redirect('/');
	}
});


//projectregistration page


app.post('/projectregistration',function (req,res) {
	if(req.session.loggedin) {
		var id1=req.body.id1;
		if(id1){
		var id2=req.body.id2;
		var id3=req.body.id3;
		var id4=req.body.id4;
		console.log(id1,"k",id2,"k",id3,"k",id4);
		var guide=req.body.guide;
		var guideid=req.body.guideid;
		var count=req.body.count;
		console.log("guidename :",guide);
		console.log("guideid :",guideid);
		console.log("count :",count);

		var array=[];
		array.push(id1);
		array.push(id2);
		array.push(id3);
		array.push(id4);
		console.log(array);
		console.log(array.length);
		// for(var i=0; i < array.length ; i++){
		// 	if(array[i] == ''){
		// 		console.log(i);
		// 		array.splice(i,1);
		// 	}
		// }

				var i=0;
				var index;
				while(i < array.length){
					if(array[i] == ''){
						console.log(i);
						array.splice(i,1);
						i=i-1;
					}
					i=i+1;
				}

				var c=0;
				for(var i=0;i<array.length;i++){
					for(var k=i+1;k<array.length;k++){
						if(array[i] == array[k]){
							c=c+1;
						}
					}
				}

					console.log(array);
					console.log(array.length);

	//connecting the faculty database and fetch the count value

		connection.query("select * from projectinfo where id IN('"+id1+"','"+id2+"','"+id3+"','"+id4+"')",function(err,results){
			if(results.length > 0 ){
				console.log(' ur already registered');
				req.flash('fresult','Some of IDs already registered');
				res.redirect('/studentRegistration');
			}
			else if( c > 0){
				console.log(' same id numbers');
				req.flash('fresult','u entered same id numbers');
				res.redirect('/studentRegistration');
			}
			else{

									console.log('result length');
									connection.query("select * from student where id IN('"+id1+"','"+id2+"','"+id3+"','"+id4+"')",function (err,result) {
											console.log(result.length);
											if(err){
												throw err;
											}
											if(array.length == result.length){
													var rid=uuid.v4();
													var pending='pending';
													var d=0;

													while(d < result.length){
														if(result[d].id == id1){
															index=d;
															console.log("in: ",index);
														}
														d=d+1;
													}
													var naming=result[index].username;
													console.log("in: ",result[index].username);
													console.log("id: ",result[index].id);
													if(result[index].id == id1){
														console.log("in: ",index);

														var tcount=1;
														connection.query("insert into projectinfo (id,name,guideid,guidename,pid,tcount) values('"+id1+"','"+naming+"','"+guideid+"','"+guide+"','"+rid+"','"+tcount+"')",function (err,result) {
															if(err){
																console.log("i am at insert project");
																throw err;
															}else{
																count--;
																connection.query("update faculty set count='"+count+"' where id='"+guideid+"'",function (err,result) {
																	if(err){
																		console.log("error occured updating faculty page 325");
																		throw err;
																	}
																});
																console.log('successfully inserted in projectinfotable');
														}
														});
													}
													var j=0;
													while(j < result.length){
															if(j!=index){
																	connection.query("insert into request(sended,recieved,status,pid,guidename,guideid) values('"+id1+"','"+result[j].id+"','"+pending+"','"+rid+"','"+guide+"','"+guideid+"')",function (err,result) {
																		if(err){
																			console.log("i am at insert request");
																			throw err;
																		}
																			console.log('successfully inserted in request');
																	});

														}
														j=j+1;
													}


																connection.query("update student set pid = '"+rid+"' where id = '"+req.session.username+"' ",function (err,result) {
																			if(err){
																				console.log("i am at insert student");
																				throw err;
																			}
																			console.log('successfully inserted in student');
																	});






												// if(result[0].id == id1 && result[1].id == id2 && result[2].id == id3 && result[3].id == id4){
												// 	connection.query("insert into projectinfo values('"+id1+"','"+id2+"','"+id3+"','"+id4+"','"+guide+"','"+rid+"')",function (err,result) {
												// 		if(err){
												// 			throw err;
												// 		}
												// 		console.log(result);
												// 		console.log('successfully inserted in projectinfotable');
												// 	});
												//
												// 	connection.query("update student set pid = '"+rid+"' where id = '"+id1+"' or id='"+id2+"' or id='"+id3+"' or id='"+id4+"' ",function (err,result) {
												// 		if(err){
												// 			throw err;
												// 		}
												// 		console.log(result);
												// 		console.log('successfully inserted in student');
												// 	});
												// }


											}
											else{
												console.log('not equal');
											}

									});

									req.flash('fresult','Successfully Registered & sended friend Requests');
									res.redirect('/studentRegistration');
				}
			});
		}else{
			req.flash('fresult','ur not goto that page directly');
			res.redirect('/studentRegistration');
		}

	}else {
		res.redirect('/');
	}
});





// Projectd page or(Index page)



app.get('/projects',function(req,res){
	console.log('at index page');
	if (req.session.loggedin) {
		console.log('at index page');
		var obj={};
		connection.query("select * from files", function (err, result) {
			if (err){
				 throw err;
			 }
			else{
				obj={print: result};
			}
		});
		res.render('projects',obj);
	} else {
		res.redirect('/');
	}
	res.end();
});


app.post('/download',function(req,res){
    var id=req.body.id;
    console.log(id);
    connection.query("select filepath from files where id = ?",id ,function (err, result) {
      if (err){
				throw err;
			}
      else{
        console.log(result);
        res.download('./views/uploads/'+result[0].filepath);

      }

    });
  });




app.get('/upload',function (req,res) {
	if (req.session.loggedin) {
		res.render('upload',{upmsg:req.flash('failed')});
	}else {
		res.redirect('/');
	}
	res.end();
});

app.post('/upload',function(req,res){
	console.log(req.files);
	if(req.files.upfile && req.files.upfils){
		var file = req.files.upfile,
			name = file.name,
			size=file.size,
			type = file.mimetype;

			var file2 = req.files.upfils,
		      name2 = file2.name,
					size2=file2.size,
		      type2 = file2.mimetype;


		var uploadpath = __dirname + '/views/uploads/' + name;
		var uploadpath2 = __dirname + '/views/uploads/' + name2;
		console.log(size);
		console.log(size2);

		var filesize= size/1000000;
		var fsize=size2/1000000;

				if(filesize < 50 && fsize <50){

						var lin = name;
						var id=req.body.id;
						var proj=req.body.projectname;
						var guide=req.body.guide;
						var about=req.body.about;



						var a=0;
						file.mv(uploadpath,function(err){
							if(err){
								console.log("File Upload Failed",name,err);
								res.send("Error Occured!")
							}
							else {
								a=1;

								console.log("File Uploaded",name);
							}
						});


						var b=0;
						file.mv(uploadpath2,function(err){
				      if(err){
				        console.log("File Upload Failed2");
				        res.send("Error Occured!")
				      }
				      else {
								b=1;
				        console.log("File Uploaded2");

				      }
				    });

						connection.query("INSERT INTO files VALUES ('"+id+"','"+lin+"','"+id+"','"+proj+"','"+guide+"','"+about+"','"+name2+"') ",function (err, result) {
							if (err) {throw(err);}
							else{
									console.log("Number of records inserted: " );
									req.flash('failed','successfully uploaded');
									var data='successfully uploaded';
									res.redirect('/upload');
								}
						});

		 	}

			else{
				req.flash('failed','file size is too match');
				res.redirect('/upload');
			}
	}
	else {
		req.flash('failed','Files is not selected');
		res.redirect('/upload');
		res.end();
	};
});


server.listen(9999);
console.log('server started on port 9999');
