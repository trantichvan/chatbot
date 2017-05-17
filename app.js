var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROqT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var intents = new builder.IntentDialog();
var key = new builder.IntentDialog();
//build gooogle serach in ra 129 ket qua dau tien
var google = require('google');
var google_image = require('google-image-query');
var writeFile = require('write');
var fs = require('fs');

//======================
bot.dialog('/', intents, key
); // thu nghiem cu phap doi ten

intents.matches(/^doiten/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Bạn đổi tên thành %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Xin Chào %s!', session.userData.name);
		session.beginDialog('/luachon');

    }
]);

bot.dialog('/profile', [
    function (session) {
        session.userData.chiso = 0;
        builder.Prompts.text(session, 'Xin Chào! Tên bạn là gì?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();

    }
]);

// Dialog Tu Khoa
key.matches(/^doikey/i, [
    function (session) {
        session.beginDialog('/key');
    }
]);

//

bot.dialog('/luachon',[
    function(session){
        session.send('Vui lòng chọn chức năng'); // chu y phan biet ham sesion.send va builder.Prompts
        session.send('Nhập 1: Để tìm kiếm thứ hạng web với 1 từ khóa');
        builder.Prompts.text(session,'Nhập 2: Để tìm kiếm thứ hạng web với nhiều từ khóa');

    },
    function(session,results){
        session.userData.luachon = results.response;
        session.beginDialog('/luachon1');
    }
    ]);

//
/*bot.dialog('/luachon1',[
    function(session){
        var chucnang = session.userData.luachon;
        switch (chucnang)
        {
            case 1 : {
            session.beginDialog('/key');
            //break;
                     }
            case 2: {
            session.beginDialog('/inputkeys');
            //break;
                    }   
            default : {
            session.send('Sai cú pháp, vui lòng nhập lại');
            session.beginDialog('/luachon');
                    }
        }
    }
    ]); */

bot.dialog('/luachon1',[
    function(session){
        if(session.userData.luachon == 1)
            session.beginDialog('/key');
        else
            if(session.userData.luachon == 2)
            session.beginDialog('/inputkeys');
            else{
            session.send('Sai cú pháp, vui lòng nhập lại');
            session.beginDialog('/luachon');
        }
    }
    ]); 

                //Chuc Nang 1

bot.dialog('/key', [
    function (session) {
        //session.userData.luachon = 0;
        builder.Prompts.text(session, 'Bạn muốn tìm từ khóa nào?');
    },
    function (session, results,next) {
        session.userData.key = results.response;
		session.send('Bạn muốn tìm từ khóa %s với tên miền nào ?', session.userData.key);
        next();
    },
    function(session){
        builder.Prompts.text(session, 'Vui lòng ghi đúng tên miền');
    },
    function (session,results) {
        session.userData.tenmien = results.response;
        session.send('Bạn muốn vị trí web  %s với từ khóa %s ?', session.userData.tenmien, session.userData.key);
        session.beginDialog('/crawler'); //crawler

    }

]);

//

/* bot.dialog('/inputtenmien',[
    function (session) {
    builder.Prompts.text(session, 'Vui lòng ghi đúng tên miền');
    },
    function (session,results) {
        session.userData.tenmien = results.response;
        session.send('Bạn muốn vị trí web  %s với từ khóa %s ?', session.userData.tenmien, session.userData.key);
        session.beginDialog('/crawler'); //crawler

    }
    ]) */

//Dialog crawler
bot.dialog('/crawler',[
    function(session){
        google.resultsPerPage = 25
        var nextCounter = 0
                // hàm google thỉnh thoảng bị lỗi IP
        google(session.userData.key, function (err, res){
            if (err) console.error(err)
 
            for (var i = 0; i < res.links.length; ++i) {
                var link = res.links[i];
                console.log(link.title + ' - ' + link.href) //hien thi  title va link
                console.log(link.description + "\n")
                fs.appendFileSync('data.http',"\n" + link.href); // ghi link vào file txt
  }
 
  if (nextCounter < 4) {
    nextCounter += 1
    if (res.next) res.next()
  }
})
        session.beginDialog('/delay')
    }
    ]);

//

bot.dialog('/delay', [
    function (session) {
        session.send("Hệ thống đang xử lý.Vui lòng chờ trong giây lát!");
        setTimeout(function() {
        session.beginDialog('/hienthi1');
                            }, 7500); // thoi gian cho luu link vao data.http 
                                    // chưa ổn định do tùy thuộc vào tốc độ mạng
    }
]);
// Dialog xu ly in ket qua ra man hinh
bot.dialog('/hienthi1', [
    function (session) {
        var array = fs.readFileSync('data.http').toString().split("\n"); // doc du lieu vao 1 mang string,
            for(i in array) {                              // split hàm cắt dữ liệu được phân cách bằng \n
                console.log(array[i]);
                            }
        var tenmien = session.userData.tenmien.toString(); //chuyen ten mien thanh chuoi
            for (i=0;i<array.length; i+=1){
                    if(array[i].indexOf(tenmien) >-1) //kiem tra ten mien trong 1 duong link
                    {
                        var a=1;
                        console.log(i);
                        session.send("Vị trí web là %s trong %s kết quả đầu tiên",i,array.length);
                        if(i<30)
                            session.send("Vị trí web tốt");
                        else
                            send.send("Vị trị web chưa tốt");
                        session.beginDialog('/resetdata');
                        session.endDialog();
                                        };
                    }
            if(a!=1)
            {
        session.send("Không tìm thấy thông tin web trong %s kết quả trả về", array.length); // loi mang rong + chua dong bo + loi string
                session.beginDialog('/resetdata');
            }
}]);
// Dialog reset file data.html
bot.dialog('/resetdata', [
    function(session) {
        fs.writeFile('data.http', "", function(err) {
          if(err) {
               return console.log(err);
                   }
       console.log("The file was reset");
});
        session.userData.luachon =0;
        session.beginDialog('/luachon');
    }
]);

            //Chuc nang 2

bot.dialog('/inputkeys',[
    function(session){
        //session.userData.luachon = 0;
        builder.Prompts.text(session, 'Nhập các từ khóa, mỗi từ khóa được cách nhau bởi dấu phẩy'); // hàm này để chạy hàm function bên dưới khác với session.send
    },
    function (session, results) {
        session.userData.keys = results.response;
        session.beginDialog('/inputtenmien1');
    }
    ]);

//

bot.dialog('/inputtenmien1',[
    function (session) {
        session.send('Bạn muốn tìm các từ khóa %s với tên miền nào ?', session.userData.keys);
        builder.Prompts.text(session, 'Vui lòng ghi đúng tên miền');
    },
    function (session,results) {
        session.userData.tenmien = results.response;
        var keysstring = session.userData.keys.toString();
        fs.appendFileSync('data.txt',keysstring);
        session.beginDialog('/process'); //crawler

    }
    ])

//

bot.dialog('/process',[
    function(session){
        var keys = fs.readFileSync('data.txt').toString().split(",");
        var chiso = session.userData.chiso;
        google.resultsPerPage = 25
        var nextCounter = 0
                // hàm google thỉnh thoảng bị lỗi IP
        google(keys[chiso], function (err, res){
            if (err) console.error(err)
 
            for (var i = 0; i < res.links.length; ++i) {
                var link = res.links[i];
                console.log(link.title + ' - ' + link.href) //hien thi  title va link
                console.log(link.description + "\n")
                fs.appendFileSync('data.http',"\n" + link.href); // ghi link vào file html
                                                        }
        if (nextCounter < 4) {
            nextCounter += 1
        if (res.next) res.next()
                             }
                                                        })

        session.beginDialog('/delay2');

                    }
                        ]);

//

bot.dialog('/delay2',[
    function (session) {
        setTimeout(function() {
        session.beginDialog('/hienthi2');
                            }, 8500); // thoi gian cho luu link vao data.http 
                                    // chưa ổn định do tùy thuộc vào tốc độ mạng
    }
    ]);

//
// Dialog hiện thị cho nhiều từ khóa
bot.dialog('/hienthi2', [
    function (session) {
        var keys = fs.readFileSync('data.txt').toString().split(",");
        var chiso = session.userData.chiso; 
        var array = fs.readFileSync('data.http').toString().split("\n"); // doc du lieu vao 1 mang string,
            for(i in array) {                              // split hàm cắt dữ liệu được phân cách bằng \n
                console.log(array[i]);
                            }
        var tenmien = session.userData.tenmien.toString(); //chuyen ten mien thanh chuoi
            for (i=0;i<array.length; i+=1){
                    if(array[i].indexOf(tenmien) >-1) //kiem tra ten mien trong 1 duong link
                    {
                        var a=1;
                        console.log(i);
                        session.send("%s Vị trí web là %s trong %s kết quả đầu tiên",keys[chiso],i,array.length);
                        if(i<30)
                            session.send("Vị trí web tốt");
                        else
                            session.send("Vị trị web chưa tốt");
                        session.beginDialog('/resetdata1');
                                        };
                    }
            if(a!=1)
            {
        session.send("Không tìm thấy thông tin web trong %s kết quả trả về", array.length); // loi mang rong + chua dong bo + loi string
                session.beginDialog('/resetdata1');
            }
}]);

// Dialog reset file data.html
bot.dialog('/resetdata1', [
    function(session){
        fs.writeFile('data.http', "", function(err) {
          if(err) {
               return console.log(err);
                   }
       console.log("The file was reset");
});
        session.beginDialog('/resetdatatxt1');
    }
]);

// Dialog reset file data.txt
bot.dialog('/resetdatatxt1',[
    function(session){
        var keys = fs.readFileSync('data.txt').toString().split(","); //chia ra thanh mang phan tach boi dau ,
        session.userData.chiso = session.userData.chiso +1;
        if(session.userData.chiso < keys.length)
            session.beginDialog('/process')
        else {
            fs.writeFile('data.txt', "", function(err) {
          if(err) {
               return console.log(err);
                   }
       console.log("The file was reset");
       session.userData.chiso = 0;
       session.userData.luachon =0;
       session.beginDialog('/luachon');
});

    }       
                } 
    ]);

//
/* bot.dialog('/timkiem',[
    function(session){
        builder.Prompts.text(session,'Nhập từ khóa muốn tìm kiếm')
    },
    function(session,results){
        session.userData.tukhoa = results;
        session.beginDialog('/timkiem1');
    }
    ]);

//
bot.dialog('/timkiem1',[
    function(session){
        var tukhoa = session.userData.tukhoa.toString();
        google_image.search("táo",10,function(url_list){
        var url_str = url_list.join('\n');
        console.log(url_str);
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
        new builder.HeroCard(session)
        .images([builder.CardImage.create(session,'url_str')])
        ])
    });
    }
    ]);

bot.dialog('/mau', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Classic Gray T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/grayshirt.png')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
            ]),
        new builder.HeroCard(session)
            .title("Classic Gray T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/grayshirt.png')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
            ])
    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i }); */