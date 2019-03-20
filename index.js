const cookieParser = require("cookie-parser");
const ejsLint = require('ejs-lint');
const express = require("express");
const fetch = require("node-fetch");

const app = express();

const API_URL = process.env.API_URL;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function setup() {

	app.get("/", (req, res) => {
		var token = undefined;
		if(req.cookies) {
			token = req.cookies.token ? req.cookies.token : undefined;
		}
		res.render("pages/index.ejs", { members: [{name: "Enter token above. You can get this by using 'pk;token'"}], member: undefined, token: token, system: undefined})
	});

	app.post("/dashboard", (req, res) => {
		if(!req.body.token && !req.cookies.token) return res.send("ERROR: system token not supplied");
		if(req.body.token && !req.cookies.token) res.cookie("token",req.body.token, {expires: new Date("01/01/2030")});
		fetch(API_URL + "/s",{
			headers: {
				"X-Token": req.cookies.token || req.body.token
			}
		}).then(async resp=>{
			if(resp.status == "404") return res.send("ERROR: system not found");
			var sys = await resp.json();
			fetch(`${API_URL}/s/${sys.id}/members`).then(async resp2=>{
				var members = await resp2.json();
				var membcount = members.length;
				fetch(`${API_URL}/s/${sys.id}/switches`).then(async resp3=>{
					var data = await resp3.json();
					var fronter_ids = (data[0] ? data[0].members : []);
					var fronters = members.filter(m => fronter_ids.includes(m.id));
					res.render("pages/dashboard.ejs",{members: membcount, member: ((fronters[0] ? ", " +fronters[0].name : (sys.name ? ", "+ sys.name : ""))), fronters: (fronters || []), system: sys, token: req.cookies.token, edit: false});
				})
			})
			
		})
	})

	app.get("/dashboard",(req,res)=>{
		if(!req.cookies.token) return res.send("ERROR: system token not supplied");
		fetch(API_URL + "/s",{
			headers: {
				"X-Token": req.cookies.token
			}
		}).then(async resp=>{
			if(resp.status == "404") return res.send("ERROR: system not found");
			var sys = await resp.json();
			fetch(`${API_URL}/s/${sys.id}/members`).then(async resp2=>{
				var members = await resp2.json();
				var membcount = members.length;
				fetch(`${API_URL}/s/${sys.id}/switches`).then(async resp3=>{
					var data = await resp3.json();
					var fronter_ids = (data[0] ? data[0].members : []);
					var fronters = members.filter(m => fronter_ids.includes(m.id));
					res.render("pages/dashboard.ejs",{members: membcount, member: ((fronters[0] ? ", " +fronters[0].name : (sys.name ? ", "+ sys.name : ""))), fronters: (fronters || []), system: sys, token: req.cookies.token, edit: false});
				})
			})
		})
	})

	app.get("/members",(req,res)=>{
			if(!req.cookies.token) return res.send("ERROR: system token not supplied");
		fetch(API_URL + "/s",{
			headers: {
				"X-Token": req.cookies.token
			}
		}).then(async resp=>{
			if(resp.status == "404") return res.send("ERROR: system not found");
			var sys = await resp.json();
			fetch(`${API_URL}/s/${sys.id}/members`).then(async resp2=>{
				var membs = await resp2.json();
				membs = await membs.sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))
				res.render("pages/members.ejs",{members: membs, member: (req.body.member || undefined), system: sys, token: req.cookies.token, edit: (req.body.edit || false)});
			})
		})
	})

	app.post("/members",(req,res)=>{
		if(!req.cookies.token) return res.send("ERROR: system token not supplied");
		fetch(API_URL + "/s",{
			headers: {
				"X-Token": req.cookies.token
			}
		}).then(async resp=>{
			if(resp.status == "404") return res.send("ERROR: system not found");
			var sys = await resp.json();
			fetch(`${API_URL}/s/${sys.id}/members`).then(async resp2=>{
				var membs = await resp2.json();
				membs = await membs.sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))
				res.render("pages/members.ejs",{members: membs, member: (req.body.member || undefined), system: sys, token: req.cookies.token, edit: (req.body.edit || false), action_type: (req.body.action_type || undefined)});
			})
		})
	})

		app.post("/submit",(req,res)=>{
			if(!req.body.action_type) return res.send("ERROR: action type not supplied");
			if(!req.body.token && !req.cookies.token) return res.send("ERROR: system token not supplied")
			var token = req.body.token || req.cookies.token;
			switch(req.body.action_type){
				case "memberedit":
					if(!req.body.member) return res.send("ERROR: memberedit action type; member not supplied");
					var member = JSON.parse(req.body.member);
					req.body.system = req.body.system.id ? req.body.system : JSON.parse(req.body.system);
					req.body.birthday = req.body.birthday == "" ? null : req.body.birthday;
					fetch(`${API_URL}/m/${member.id}`,{
						method: "PATCH",
						headers: {
							"X-Token": token
						},
						body: JSON.stringify(req.body)
					}).then(async resp => {
						switch(resp.status.toString()) {
							case "401":
								res.send("ERROR: unauthorized (your token may be wrong)");
								break;
							case "400":
								res.send("ERROR: bad request. something went wrong :(")
								break;
							default:
								var data = await resp.json();
								res.render("pages/submit.ejs",{member: JSON.stringify(data), system: req.body.system});
								break;
						}
					})
					break;
				case "membercreate":
					if(!req.body.member) return res.send("ERROR: memberedit action type; member not supplied");
					var member = JSON.parse(req.body.member);
					req.body.system = req.body.system.id ? req.body.system : JSON.parse(req.body.system);
					req.body.birthday = req.body.birthday == "" ? null : req.body.birthday;
					console.log(req.body);
					fetch(`${API_URL}/m`,{
						method: "POST",
						headers: {
							"X-Token": token
						},
						body: JSON.stringify({"name": req.body.name})
					}).then(async resp => {
						switch(resp.status.toString()) {
							case "401":
								res.send("ERROR: unauthorized (your token may be wrong)");
								break;
							case "400":
								res.send("ERROR: bad request. something went wrong :(")
								break;
							default:

								// var membdat = await fetch(API_URL + "/m/" + (await resp.text()),{
								// 	method: "PATCH",
								// 	headers: {
								// 		"X-Token": token
								// 	},
								// 	body: JSON.stringify(req.body)
								// });
								var data = await resp.text();
								console.log(data);
								// res.render("pages/submit.ejs",{member: JSON.stringify(data), system: JSON.stringify(req.body.system)});
								break;
						}
					})
					break;
				default:
					res.send("Something went wrong :(")
					break;
			}
		})

		app.get("/login",(req,res)=>{
			res.render("pages/login.ejs");
		})

		app.get("/logout",(req,res)=>{
			res.clearCookie("token");
			res.render("pages/logout.ejs");
		})
}

setup();
app.listen(8080);