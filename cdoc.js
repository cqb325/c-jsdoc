var fs = require("fs");
var path = require("path");
var ejs = require("ejs");
var config = require("./config");

var rootdir = ".";
var reg = /\/\*\*(\s|.)*?\*\//g;
var reg1 = /\s+.\*/g;
var tagreg = /@[a-z]+/;

var outpath = "out/classes/";
var outfilepath = "out/files/";
var outlib = "out/lib/";
var classes = [];

function readAllJS(path){
	var files = fs.readdirSync(path);
	for(var i in files){
		var stats = fs.statSync(path+"/"+files[i]);
		if(stats.isDirectory()){
			readAllJS(path+"/"+files[i]);
		}else{
			var filename = files[i];
			var filepath = path+"/"+filename;
			if(filename.indexOf(".js") != -1){
				parse(filepath);
			}
		}
	}
}

function doDoc(fpath){
	if (fs.existsSync(fpath+ "/out")) {
		rmdirSync(fpath + "/out");
	}
	mkdirSync(fpath + "/" + outpath);
	mkdirSync(fpath + "/" + outfilepath);
	mkdirSync(fpath + "/" + outlib);
	readAllJS(fpath);
	
	//拷贝lib文件
	copyFiles(fpath);
	
	fs.readFile("template/index.html","UTF-8", function(err, cont){
		var filepath = path.join(fpath,"out","index.html");
		var html = ejs.render(cont, { classlist: classes, config: config.data});
		fs.writeFile(filepath, html, "UTF-8", function(){
			console.log(filepath+" success!");
		});
	});
	
	for(var i in classes){
		var file = classes[i].file;
		fs.readFile("template/file.html","UTF-8", function(err, cont){
			var filepath = path.join(fpath,outfilepath,file.replace("/","_")+".html");
			var html = ejs.render(cont, { html: classes[i].filedata, filename: file, classlist: classes, config: config.data});
			fs.writeFile(filepath, html, "UTF-8", function(){
				console.log(filepath+" success!");
			});
		});
		
		fs.readFile("template/class.html","UTF-8", function(err, cont){
			var filename = file.replace(".js",".html");
			var filepath = path.join(fpath,outpath,classes[i]["class"]["class"]+".html");
			var html = ejs.render(cont, { data: classes[i], classlist: classes, config: config.data});
			fs.writeFile(filepath, html, "UTF-8", function(){
				console.log(filepath+" success!");
			});
		});
	}
}

function copyFiles(root){
	var files = ["index.js","jquery-1.7.1.min.js","prettify.css","prettify.js","style.css"];
	for(var i in files){
		copyFile(root, files[i]);
	}
}

function copyFile(root, file){
	fs.readFile("lib/"+file, "UTF-8", function(err, cont){
		var filepath = path.join(root,outlib,file);
		fs.writeFile(filepath, cont, "UTF-8", function(){
		});
	});
}

function parse(file){
	var base = path.dirname(file);
	var filedata = fs.readFileSync(file,"UTF-8");
	var lines = filedata.split(/\n/);
	for(var i in lines){
		var num = parseInt(i)+1;
		lines[i] += "####"+num+"####\n";
	}
	
	var rets = lines.join("").match(reg);
	var parts = [];
	var data = {};
	for(var i in rets){
		var notes = rets[i];
		var matches = notes.split(reg1);
		var part = {};
		var tags = checkTag(matches,part);
		hendleNote(tags, part);
		parts.push(part);
	}
	
	buildData(parts, data);
	data.file = file;
	data.filedata = filedata;
	data.filepath = file.replace("/","_");
	classes.push(data);
}

function checkTag(lines,part){
	var rows = [];
	for(var i = 1; i<lines.length - 1; i++){
		var line = lines[i];
		var row = {};
		if (line.trim() != "") {
			var tagname = tagreg.exec(line);
			var linenum = line.match(/####[0-9]+####/)[0];
			line = line.replace(linenum,"");
			linenum = linenum.substring(4, linenum.length-4);
			if(tagname){
				row.tag = tagname[0].substring(1);
				row.other = line.replace(tagname[0],"").trim();
				row.linenum = linenum;
				rows.push(row);
			}else{
				if(rows.length == 0){
					part.desc = line;
					continue;
				}
				var row = rows[rows.length-1];
				row.other = row.other + "\n" + line;
			}
		}
	}
	
	return rows;
}

function hendleNote(tags, part){
	for(var i in tags){
		var tag = tags[i];
		hendleTag(tag, part);
	}
}

function hendleTag(tag, part){
	var value = tag.other;
	var tagname = tag.tag;
	switch(tagname){
		case "static":
		case "final":
		case "deprecated":
		case "constructor":{
			part[tagname] = true;
			break;
		}
		case "requires":{
			part[tagname] ? part[tagname].push(value) : part[tagname] = [value];
			break;
		}
		case "return":{
			part[tagname] = {};
			var typereg = /\{[a-zA-Z]+\}/g;
			var ret = value.match(typereg);
			if(ret && ret.length){
				var returntype = ret[0].substring(1,ret[0].length-1);
				part[tagname]["type"] = returntype;
				var desc = value.replace(ret[0],"").trim();
				part[tagname]["desc"] = desc;
			}
			break;
		}
		case "param":{
			part[tagname] ? false : part[tagname] = [];
			var param = {};
			var parts = value.split(/\x20+/);
			var name = parts[0].indexOf("{") == -1 ? parts[0] : parts[1];
			var type = parts[0].indexOf("{") == -1 ? parts[1] : parts[0];
			type = type.substring(1,type.length-1);
			
			param["name"] = name;
			param["type"] = type;
			param["desc"] = "";
			for(var i=2; i<parts.length; i++){
				param["desc"] += parts[i].replace(/\s+/g," ");
			}
			part[tagname].push(param);
			break;
		}
		default:{
			part[tagname] = value;
		}
		
		part.linenum = tag.linenum;
	}
}

function buildData(parts, data){
	for(var i in parts){
		var part = parts[i];
		if(part.property){
			data.property ? data.property.push(part) : data.property = [part];
		}
		if(part.method){
			data.method ? data.method.push(part) : data.method = [part];
		}
		if(part["class"]){
			data["class"] = part;
		}
		if(part.module){
			data.module = part.module;
		}
	}
}

function mkdirSync(url,mode,cb){
    var path = require("path"), arr = url.split("/");
    mode = mode || 0755;
    cb = cb || function(){};
    if(arr[0]==="."){//���� ./aaa
        arr.shift();
    }
    if(arr[0] == ".."){//���� ../ddd/d
        arr.splice(0,2,arr[0]+"/"+arr[1])
    }
    function inner(cur){
        if(!path.existsSync(cur)){//�����ھʹ���һ��
            fs.mkdirSync(cur, mode)
        }
        if(arr.length){
            inner(cur + "/"+arr.shift());
        }else{
            cb();
        }
    }
    arr.length && inner(arr.shift());
}


var rmdirSync = (function(){
    function iterator(url,dirs){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);//�ռ�Ŀ¼
            inner(url,dirs);
        }else if(stat.isFile()){
            fs.unlinkSync(url);//ֱ��ɾ���ļ�
        }
    }
    function inner(path,dirs){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs);
        }
    }
    return function(dir,cb){
        cb = cb || function(){};
        var dirs = [];
  
        try{
            iterator(dir,dirs);
            for(var i = 0, el ; el = dirs[i++];){
                fs.rmdirSync(el);//һ����ɾ�������ռ�����Ŀ¼
            }
            cb()
        }catch(e){//����ļ���Ŀ¼��4�Ͳ����ڣ�fs.statSync�ᱨ�?�������ǻ��ǵ���û���쳣����
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})();


doDoc(config.data.basepath);