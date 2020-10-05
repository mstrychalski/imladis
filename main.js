var apiUrl = 'http://104.248.131.70:3001';
var username = '';
var isIframe = self !== top;

$('#punwrap').hide();
NProgress.set(0.4);

function initLoader() {

}

function mockFromHtml(html, actualElement) {
    var mock = $(html);

    mock.click(function() {
        embedElement(actualElement, mock);
    });

    return mock;
}

function getYoutubePlayer(youtubeHash) {
    return '<p>' +
        '<iframe style="max-width: 100%;" width="640" height="360" src="https://www.youtube.com/embed/'+youtubeHash+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
        '</p>';
}

function getYoutubePlayerMock(youtubeHash, el) {
    var player = $(getYoutubePlayer(youtubeHash));
    var mock = mockFromHtml(`
<div class="embed-mock">
    <i class="fa fa-play fa-lg fa-fw"></i>
    <img src="http://i3.ytimg.com/vi/${youtubeHash}/hqdefault.jpg" />
</div>
    `, player);

    return mock;
}

function getSpotifyPlayer(spotifyHash) {
    return '<p><iframe style="max-width: 100%;" src="https://open.spotify.com/embed/track/'+spotifyHash+'" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe></p>';
}

function getDropboxPlayer(dropboxId) {
    return '<p><video controls="controls" preload="none" style="width:640px; max-width: 100%;">\n' +
        '  <source src="http://dl.dropbox.com'+dropboxId+'" />\n' +
        '  <http://dl.dropbox.com/s/lptddodrvm1nwff/YAMIdent_webres_clean.oggtheora.ogv" />\n' +
        '</video></p>';
}

function getVimeoPlayer(vimeoId) {
    return '<p><iframe style="max-width: 100%;" title="vimeo-player" src="https://player.vimeo.com/video/'+vimeoId+'" width="640" height="360" frameborder="0" allowfullscreen></iframe></p>';
}

function getVimeoPlayerMock(vimeoId, img) {


        var player = $(getVimeoPlayer(vimeoId));
        var mock = mockFromHtml(`
<div class="embed-mock">
    <i class="fa fa-play fa-lg fa-fw"></i>
    <img src="${img}" />
</div>
    `, player);

        return mock;
}

function getGfycatPlayer(gfycatId) {
    return '<p><iframe style="max-width: 100%;" title="gfycat-player" src="https://gfycat.com/ifr/'+gfycatId+'" width="640" height="375" frameborder="0" allowfullscreen></iframe></p>';
}


function getImageEmbed(imgLink) {
    return '<p><a class="emoji" href="'+imgLink+'" target="_blank"><img style="max-width: 640px" src="'+imgLink+'"></img></a></p>';
}

function getImladisQuote(postId, author, text) {
    var link = '/viewtopic.php?pid='+postId+'#p' + postId;
    var postLink = '<a class="emoji" href="'+link+'">#'+postId+'</a>';
    return '<blockquote><div class="incqbox"><h4>'+author+' w '+postLink+':</h4><p>'+text+'</p></div></blockquote>';
}

function parseYoutubeLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.)?youtu(?:be\\.com\\/(?:watch\\?v=|v\\/)|\\.be\\/)([\\w\\-\\_]*))(&(amp;)?‌​[\\w\\?‌​=]*)?';

    regexpMatches(url, regexp, function(link, hash) {
        var player = getYoutubePlayerMock(hash, el);
        embedElement(player, el);
    });
}

function parseSpotifyLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.)?open\\.spotify\\.com\\/track\\/([\\w\\-\\_]*))?';

    regexpMatches(url, regexp, function(link, hash) {
        var player = getSpotifyPlayer(hash);
        embedElement(player, el);
    });
}

function parseDropBoxLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.)?dropbox\\.com(\\/.[^\\"]*))*?(?:avi|mp4|wmv|mov)';

    regexpMatches(url, regexp, function(link, hash) {
        var player = getDropboxPlayer(hash);
        embedElement(player, el);
    });
}

function embedElement(el, linkEl) {
    if(typeof el === 'string')
        el = $(el);

    el.insertAfter(linkEl);
    linkEl.remove();
}

function parseVimeoLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.)?vimeo\\.com\\/([\\w\\-\\_]*))?';

    regexpMatches(url, regexp, function(link, hash) {
        $.get(`https://vimeo.com/api/v2/video/${hash}.json`, function(data) {
            var player = getVimeoPlayerMock(hash, data[0].thumbnail_large);
            embedElement(player, el);
        });

    });
}

function parseGfycatLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.|thumbs\\.)?gfycat\\.com\\/([\\w\\-\\_]*)(?=-mobile|\\"))?';

    regexpMatches(url, regexp, function(link, hash) {
        var player = getGfycatPlayer(hash);
        embedElement(player, el);
    });
}

function parseImageLinks(el, url) {
    if(!strContainsAny(url,['.png', '.jpg', '.jpeg', '.gif']))
        return false;

    var hash = url.replace('dl=0', 'raw=1');
    var embed = getImageEmbed(hash);

    embedElement(embed, el);
}

function parseImladisPostLinks(el, url) {
    var regexp = '(http(?:s?):\\/\\/(?:www\\.)?imladis.p2a.pl\\/viewtopic\\.php\\?pid=([\\w\\-\\_]*))?';

    regexpMatches(url, regexp, function(link, hash) {
        if(link) {
            $.ajax({
                url: link,
                type: 'GET',
                contentType : 'text/html; charset=ISO-8859-2',
                success: function(data) {
                    var html = $(data).find('#p' + hash);

                    var author = html.find('a[href*="profile.php"]').html();
                    var message = html.find('.postmsg').html();

                    var embed = $(getImladisQuote(hash, author, message));

                    parsePosts(embed.find('.incqbox p'));
                    embedElement(embed, el)
                },
                beforeSend: function(xhr) {
                    xhr.overrideMimeType('text/html; charset=ISO-8859-2');
                }
            });
        }
    });
}

function regexpMatches(string, regexprule, callback) {
    var regexp = new RegExp(regexprule,'g');
    var match = regexp.exec(string);
    regexp.lastIndex = 0;

    if (match && match.length > 2 && match[0] && match[1] && match[2]) {
        callback(match[1], match[2]);
    }
}

function parseAll(el, url) {
    if(!el || !url) return false;

    parseYoutubeLinks(el, url);
    parseSpotifyLinks(el, url);
    parseDropBoxLinks(el, url);
    parseVimeoLinks(el, url);
    parseImageLinks(el, url);
    parseImladisPostLinks(el, url);
    parseGfycatLinks(el, url);
}

function parsePosts(root) {
    if(root === undefined)
        root = $('.postmsg ');

    root.find('a').each(function() {
        var el = $(this);

        if(el) parseAll(el, el.prop('href'));
    });

    root.find('embed').each(function() {
        var el = $(this);

        parseYoutubeLinks(el, el.prop('src'));
    });
}

//Mobile post menu
var menuHidden = true;


function postMenu() {
    $('.blockpost').click(postMenuClick);
}

function postMenuClick(e){
    var footer = $(this).find('.postfootright,.postfootright');
    menuHidden = !menuHidden;

    if(menuHidden) {
        footer.hide();
    } else {
        footer.show();
    }
}

//Dev checking
var isDev = false;
function checkIfDev() {
    isDev = window.location.href.indexOf('&dev') !== -1;
}
//Latest posts
function getForumCategoryTableStructure(title, id) {
    return `
<div id="${id}" class="blocktable">
    <h2>
        <span class="conr"><a class="emoji" href="javascript:togglecategory(1);"><img src="img/exp_up.png" alt="Collapse" id="img_latest"></a></span>
        <span>${title}</span>
    </h2>
    <div class="box" id="box_latest">
        <div class="inbox">
            <table cellspacing="0">
                <thead>
                <tr>
                    <th class="tcl" scope="col">Forum</th>
                    <th class="tcr" scope="col">Ostatni post</th>
                </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </div>
</div>
    `;
}

function getForumCategoryTableRow(tcr, intd) {
    return `
<tr class="inew">
    <td class="tcl">
        <div class="intd">
            ${intd}
        </div>
    </td>
    <td class="tcr">
        ${tcr}
    </td>
</tr>
    `
}

function getForumCategoryTable(items, id, intdSelector, tcrSelector) {
    var latestTable;

    if (items.length) {
        latestTable = $(getForumCategoryTableStructure('OSTATNIO AKTYWNE', id));
        var tbody = latestTable.find('tbody');

        items.each(function () {
            var intd = $(this).find(intdSelector).html();
            var tcr = $(this).find(tcrSelector).html();
            tbody.append(getForumCategoryTableRow(tcr, intd));
        });
    }

    return latestTable;
}

function getLatest() {
    var newPosts = $('tr.inew');
    var latestTable = getForumCategoryTable(newPosts, 'idxlatest', '.intd', '.tcr');

    if(latestTable) {
        latestTable.insertAfter($('#announce'));
    }
}



function getSubscribed() {
    $.get('/search.php?action=show_subscriptions', function(res) {
        var items = $(res).find('.blocktable tr');

        var subscribedTable = getForumCategoryTable(items, 'idxsubscribed', '.intd', '.tcr');
        var latest = $('#idxlatest');

        if (subscribedTable) {
            subscribedTable.insertAfter($(latest.length ? '#idxlatest' : '#announce'));
        }
    });
}

//routing
function onPunClass(id, callback) {
    var punId = $('.pun').prop('id');
    if(punId === id)
        callback();
}

//menu menu
var menuOpen = false;
function toggleMenu(state) {
    if(state === undefined)
        menuOpen = !menuOpen;
    else
        menuOpen = state;

    if(menuOpen) {
        $('#brdheader #brdmenu').show();
    } else {
        $('#brdheader #brdmenu').hide();
    }
}

function handleMenu() {
    var menuButton = $('<i class="fa fas fa-bars"></i>');
    menuButton.click(function(e) {
        toggleMenu();
        e.stopPropagation();
    });

    $('#brdwelcome').prepend(menuButton);

    $(window).click(function() {
        toggleMenu(false);
    });
}

function setFirstButtonAsLatestPosts() {
    $('#brdwelcome .conr li:first-child a').prop('href', '/search.php?action=show_new');
}

function toggleFixedEditor(state) {
    var editor = $('.blockform');

    if(state) {
        editor.addClass('fixed');
        toggleEditor(false);
    } else {
        editor.removeClass('fixed');
    }
}

function handleScroll() {
    var bottomLinks = $('.postlinksb');


    $(window).scroll(function(e) {
        var height = $(window).scrollTop() + window.innerHeight;
        var editorOffset = bottomLinks.offset().top + bottomLinks.height();

        if(height < editorOffset) {
            toggleFixedEditor(true);
        } else {
            toggleFixedEditor(false);
        }
    });
}

function openClickableBackground(className) {
    closeClickableBackground();

    var clickableBackground = $(`<div class="clickable-background ${className}"></div>`);

    $('#punwrap > div').append(clickableBackground);

    return clickableBackground;
}

function closeClickableBackground() {
    $('.clickable-background').remove();
}

// Edytor

function getEmojiContainer() {
    return `
<div class="emoji-container">
    <a class="emoji" href="javascript:insert_text(':)', '');"><img src="img/smilies/smile.png" alt=":)" style="/*! max-width: 20px; *//*! max-height: 20px; */"></a>
    <a class="emoji" href="javascript:insert_text(':|', '');"><img src="img/smilies/neutral.png" alt=":|"></a>
    <a class="emoji" href="javascript:insert_text(':(', '');"><img src="img/smilies/sad.png" alt=":("></a>
    <a class="emoji" href="javascript:insert_text(':D', '');"><img src="img/smilies/big_smile.png" alt=":D"></a>
    <a class="emoji" href="javascript:insert_text(':o', '');"><img src="img/smilies/yikes.png" alt=":o"></a>
    <a class="emoji" href="javascript:insert_text(';)', '');"><img src="img/smilies/wink.png" alt=";)"></a>
    <a class="emoji" href="javascript:insert_text(':/', '');"><img src="img/smilies/hmm.png" alt=":/"></a>
    <a class="emoji" href="javascript:insert_text(':P', '');"><img src="img/smilies/tongue.png" alt=":P"></a>
    <a class="emoji" href="javascript:insert_text(':lol:', '');"><img src="img/smilies/lol.png" alt=":lol:"></a>
    <a class="emoji" href="javascript:insert_text(':mad:', '');"><img src="img/smilies/mad.png" alt=":mad:"></a>
    <a class="emoji" href="javascript:insert_text(':rolleyes:', '');"><img src="img/smilies/roll.png" alt=":rolleyes:"></a>
    <a class="emoji" href="javascript:insert_text(':cool:', '');"><img src="img/smilies/cool.png" alt=":cool:"></a>
    <a class="emoji" href="javascript:insert_text(':beer:', '');"><img src="img/smilies/trink39.gif" alt=":beer:"></a>
    <a class="emoji" href="javascript:insert_text(':angel:', '');"><img src="img/smilies/teu45.gif" alt=":angel:"></a>
    <a class="emoji" href="javascript:insert_text(':gun:', '');"><img src="img/smilies/sterb026.gif" alt=":gun:"></a>
    <a class="emoji" href="javascript:insert_text(':box:', '');"><img src="img/smilies/sport30.gif" alt=":box:"></a>
    <a class="emoji" href="javascript:insert_text(':play:', '');"><img src="img/smilies/comp13.gif" alt=":play:"></a>
    <a class="emoji" href="javascript:insert_text(':kiss:', '');"><img src="img/smilies/246.gif" alt=":kiss:"></a>
    <a class="emoji" href="javascript:insert_text(':satan:', '');"><img src="img/smilies/223.gif" alt=":satan:"></a>
    <a class="emoji" href="javascript:insert_text(':zzz:', '');"><img src="img/smilies/193.gif" alt=":zzz:"></a>
    <a class="emoji" href="javascript:insert_text(':love:', '');"><img src="img/smilies/142.gif" alt=":love:"></a>
    <a class="emoji" href="javascript:insert_text(':stu:', '');"><img src="img/smilies/1087.gif" alt=":stu:"></a>
    <a class="emoji" href="javascript:insert_text(':pa:', '');"><img src="img/smilies/042.gif" alt=":pa:"></a>
    <a class="emoji" href="javascript:insert_text(':red:', '');"><img src="img/smilies/icon_redface.gif" alt=":red:"></a>
    <a class="emoji" href="javascript:insert_text(':crez:', '');"><img src="img/smilies/stupid2.gif" alt=":crez:"></a>
    <a class="emoji" href="javascript:insert_text(':tuli:', '');"><img src="http://www.cosgan.de/images/midi/liebe/h025.gif" alt=":tuli:"></a>
    <a class="emoji" href="javascript:insert_text(':radosc:', '');"><img src="http://www.cosgan.de/images/midi/froehlich/k005.gif" alt=":radosc:"></a>
    <a class="emoji" href="javascript:insert_text(':powodzenia:', '');"><img src="http://www.cosgan.de/images/midi/froehlich/n025.gif" alt=":powodzenia:"></a>
    <a class="emoji" href="javascript:insert_text(':brawo:', '');"><img src="http://www.cosgan.de/images/midi/froehlich/k015.gif" alt=":brawo:"></a>
    <a class="emoji" href="javascript:insert_text(':dobranoc:', '');"><img src="http://www.cosgan.de/images/midi/muede/d025.gif" alt=":dobranoc:"></a>
    <a class="emoji" href="javascript:insert_text(':puknij:', '');"><img src="http://www.cosgan.de/images/midi/boese/r010.gif" alt=":puknij:"></a>
    <a class="emoji" href="javascript:insert_text(':nunu:', '');"><img src="http://www.cosgan.de/images/midi/boese/r020.gif" alt=":nunu:"></a>
    <a class="emoji" href="javascript:insert_text(':lzy:', '');"><img src="http://www.cosgan.de/images/midi/traurig/g045.gif" alt=":lzy:"></a>
    <a class="emoji" href="javascript:insert_text(':pociesz:', '');"><img src="http://www.cosgan.de/images/midi/traurig/a020.gif" alt=":pociesz:"></a>
    <a class="emoji" href="javascript:insert_text(':dzieki:', '');"><img src="http://www.cosgan.de/images/midi/konfus/g035.gif" alt=":dzieki:"></a>
    <a class="emoji" href="javascript:insert_text(':kawka:', '');"><img src="http://www.cosgan.de/images/midi/nahrung/b025.gif" alt=":kawka:"></a>
    <a class="emoji" href="javascript:insert_text(':zdrowko:', '');"><img src="http://www.cosgan.de/images/midi/nahrung/b020.gif" alt=":zdrowko:"></a>
    <a class="emoji" href="javascript:insert_text(':drink:', '');"><img src="http://www.cosgan.de/images/midi/musik/d020.gif" alt=":drink:"></a>
    <a class="emoji" href="javascript:insert_text(':pogaduchy:', '');"><img src="http://www.cosgan.de/images/midi/haushalt/b030.gif" alt=":pogaduchy:"></a>
    <a class="emoji" href="javascript:insert_text(':tort:', '');"><img src="http://www.cosgan.de/images/smilie/nahrung/n015.gif" alt=":tort:"></a>
    <a class="emoji" href="javascript:insert_text(':aniolek:', '');"><img src="http://www.cosgan.de/images/midi/engel/g020.gif" alt=":aniolek:"></a>
    <a class="emoji" href="javascript:insert_text(':no:', '');"><img src="http://www.cosgan.de/images/midi/boese/u020.gif" alt=":no:"></a>
    <a class="emoji" href="javascript:insert_text(':zlosc:', '');"><img src="http://www.cosgan.de/images/midi/boese/a055.gif" alt=":zlosc:"></a>
    <a class="emoji" href="javascript:insert_text(':len:', '');"><img src="http://www.cosgan.de/images/midi/verschiedene/f025.gif" alt=":len:"></a>
    <a class="emoji" href="javascript:insert_text(':zemdlala:', '');"><img src="http://www.cosgan.de/images/smilie/konfus/g040.gif" alt=":zemdlala:"></a>
    <a class="emoji" href="javascript:insert_text(':ach:', '');"><img src="http://www.cosgan.de/images/smilie/froehlich/e035.gif" alt=":ach:"></a>
    <a class="emoji" href="javascript:insert_text(':tak:', '');"><img src="http://www.cosgan.de/images/smilie/froehlich/k010.gif" alt=":tak:"></a>
    <a class="emoji" href="javascript:insert_text(' :fiufiu:', '');"><img src="http://www.cosgan.de/images/midi/frech/a050.gif" alt=" :fiufiu:"></a>
    <a class="emoji" href="javascript:insert_text(':wena:', '');"><img src="http://www.cosgan.de/images/smilie/verschiedene/a035.gif" alt=":wena:"></a>
    <a class="emoji" href="javascript:insert_text(':ech:', '');"><img src="http://www.cosgan.de/images/midi/traurig/d030.gif" alt=":ech:"></a>
    <a class="emoji" href="javascript:insert_text(':wrrrr:', '');"><img src="http://www.cosgan.de/images/smilie/boese/e035.gif" alt=":wrrrr:"></a>
    <a class="emoji" href="javascript:insert_text(':k:', '');"><img src="http://www.cosgan.de/images/smilie/figuren/a060.gif" alt=":k:"></a>
    <a class="emoji" href="javascript:insert_text(':ahah:', '');"><img src="http://macg.net/emoticons/laughing2.gif" alt=":ahah:"></a>
    <a class="emoji" href="javascript:insert_text(':sex:', '');"><img src="http://macg.net/emoticons/sexinbed.gif" alt=":sex:"></a>
    <a class="emoji" href="javascript:insert_text(':foto:', '');"><img src="http://macg.net/emoticons/photographer1.gif" alt=":foto:"></a>
    <a class="emoji" href="javascript:insert_text(':Polska:', '');"><img src="http://macg.net/emoticons/polska.gif" alt=":Polska:"></a>
    <a class="emoji" href="javascript:insert_text(':kwiatek:', '');"><img src="http://www.cosgan.de/images/more/flowers/042.gif" alt=":kwiatek:"></a>
    <a class="emoji" href="javascript:insert_text(':roza:', '');"><img src="http://www.cosgan.de/images/more/flowers/090.gif" alt=":roza:"></a>
    <a class="emoji" href="javascript:insert_text(':rotfl:', '');"><img src="http://www.cosgan.de/images/midi/frech/k025.gif" alt=":rotfl:"></a>
    <a class="emoji" href="javascript:insert_text(':michael:', '');"><img src="http://www.sherv.net/cm/emo/dancing/michael-jackson.gif" alt=":michael:"></a>
    <a class="emoji" href="javascript:insert_text(':pupa:', '');"><img src="http://www.sherv.net/cm/emo/funny/1/mooning.gif" alt=":pupa:"></a>
    <a class="emoji" href="javascript:insert_text(':kaczusia:', '');"><img src="http://www.senocular.com/smilies/ducky.gif" alt=":kaczusia:"></a>
    <a class="emoji" href="javascript:insert_text(':hhhh:', '');"><img src="http://yoursmiles.org/tsmile/rulez/t2027.gif" alt=":hhhh:"></a>
    <a class="emoji" href="javascript:insert_text(':good:', '');"><img src="http://yoursmiles.org/tsmile/forum/t1236.gif" alt=":good:"></a>
    <a class="emoji" href="javascript:insert_text(':wit:', '');"><img src="http://yoursmiles.org/tsmile/forum/t1230.gif" alt=":wit:"></a>
    <a class="emoji" href="javascript:insert_text(':bum:', '');"><img src="http://yoursmiles.org/csmile/friend/c0414.gif" alt=":bum:"></a>
    <a class="emoji" href="javascript:insert_text(':co:', '');"><img src="http://yoursmiles.org/csmile/question/c0313.gif" alt=":co:"></a>
    <a class="emoji" href="javascript:insert_text(':idea:', '');"><img src="http://yoursmiles.org/tsmile/idea/t9205.gif" alt=":idea:"></a>
    <a class="emoji" href="javascript:insert_text(':sos:', '');"><img src="http://yoursmiles.org/csmile/help/c0601.gif" alt=":sos:"></a>
    <a class="emoji" href="javascript:insert_text(':stop:', '');"><img src="http://yoursmiles.org/csmile/stop/c0705.gif" alt=":stop:"></a>
    <a class="emoji" href="javascript:insert_text(':witka:', '');"><img src="http://yoursmiles.org/csmile/preved/c0137.gif" alt=":witka:"></a>
    <a class="emoji" href="javascript:insert_text(':soc:', '');"><img src="http://yoursmiles.org/psmile/orator/p0902.gif" alt=":soc:"></a>
    <a class="emoji" href="javascript:insert_text(':drzewko', '');"><img src="http://yoursmiles.org/tsmile/nytree/t79024.gif" alt=":drzewko"></a>
    <a class="emoji" href="javascript:insert_text(':rotfl1:', '');"><img src="http://www.cosgan.de/images/midi/frech/c041.gif" alt=":rotfl1:"></a>
    <a class="emoji" href="javascript:insert_text(':tea:', '');"><img src="http://smileys.emoticonsonly.com/emoticons/t/tea-3615.gif" alt=":tea:"></a>
    <a class="emoji" href="javascript:insert_text(':fotki out:', '');"><img src="http://cosgan.de/smiliegenerator/ablage/800/333.png" alt=":fotki out:"></a>
    <a class="emoji" href="javascript:insert_text(':christ1:', '');"><img src="http://smileys.emoticonsonly.com/emoticons/b/bible-3776.gif" alt=":christ1:"></a>
    <a class="emoji" href="javascript:insert_text(':christ2:', '');"><img src="http://smileys.emoticonsonly.com/emoticons/p/prayer-3780.gif" alt=":christ2:"></a>
    <a class="emoji" href="javascript:insert_text(':koran:', '');"><img src="http://smileys.emoticonsonly.com/emoticons/k/koren-3801.gif" alt=":koran:"></a>
    <a class="emoji" href="javascript:insert_text(':yes:', '');"><img src="http://emotikona.pl/obrazki/pic/ok.jpg" alt=":yes:"></a>
    <a class="emoji" href="javascript:insert_text(':zulus:', '');"><img src="http://emotikona.pl/gify/pic/08aborygen.gif" alt=":zulus:"></a>
</div>
    `;
}
var editorTextArea;
var emojiContainer;

var editorExpanded = false;
var emojiContainerExpanded = false;
function toggleEditor(state) {
    if(state === undefined)
        editorExpanded = !editorExpanded;
    else
        editorExpanded = state;

    if(editorExpanded) {
        editorTextArea.css('height', '300px');

        var bg = openClickableBackground('mobile-only');
        bg.click(function(e) {
            toggleEditor(false);
        });
    } else {
        editorTextArea.css('height', '');
        toggleEmojiContainer(false);

        closeClickableBackground();
    }


}

function getIconButton(icon, href, className, style, text) {
    return `
<a href="${href ? href: '#'}" class="${className} btn-icon" ${style ? `style="${style}"` : ''}>
    <i class="fa ${icon}"></i>
    ${text ? `<span>${text}</span>` : ''}
</a>
    `;
}

function toggleEmojiContainer(state) {
    if(state === undefined)
        emojiContainerExpanded = !emojiContainerExpanded;
    else
        emojiContainerExpanded = state;

    if(emojiContainerExpanded) {
        emojiContainer.show();
    } else {
        emojiContainer.fadeOut(150);
    }
}

function openUploadImagePrompt() {
    $('#editor-img-input').click();
}

function editorImageButtonClick(e) {
    openUploadImagePrompt();

    e.preventDefault();
}

function editorEmocjiButtonClick(e) {
    toggleEmojiContainer();

    e.preventDefault();
}

function addButtons() {
    var submitButton = $('.blockform input[type="submit"]');
    var emojiButton = $(getIconButton('fa-lg fa-laugh-beam', '#', null, 'float: right'));
    var imageButton = $(getIconButton('fa-lg fa-image', '#', null, 'float: right'));
    var imageUploadInput = $('<input type="file" id="editor-img-input" name="img" accept="image/*" hidden multiple>');

    emojiButton.click(editorEmocjiButtonClick);
    imageButton.click(editorImageButtonClick);

    imageUploadInput.change(function (e) {
        NProgress.start();
        var files = e.target.files;
        var toProcess = files.length;
        var processed = 0;

        Array.prototype.forEach.call(files, (file) => {
            readURL(file).onload = (e) => {
                uploadImageAndGetUrl({
                    base64: e.target.result,
                    username: username
                }, function (res) {
                    var url = res.url;
                    NProgress.inc(1 / toProcess);
                    insertOnSelectionPos(editorTextArea, url + '\n');

                    processed++;

                    if (processed >= toProcess) {
                        NProgress.done();
                    }
                });
            }
        });
    });

    submitButton.parent().append(emojiButton);
    submitButton.parent().append(imageButton);
    submitButton.parent().append(imageUploadInput);
}

function handleEditor() {
    editorTextArea = $('.blockform .infldset.txtarea textarea');
    emojiContainer = $(getEmojiContainer());

    editorTextArea.on('focus', function() {
        toggleEmojiContainer(false);
    });

    $('.blockform .box').append(emojiContainer);

    $('.blockform').click(function(e) {
        var isFixed = $(this).hasClass('fixed');

        if(isFixed)
            toggleEditor(true);
    });

    addButtons();
}

function insert_text(txt, costam) {
    insertOnSelectionPos(editorTextArea, txt);
}

function strContains(string, array) {
    string = string.toLowerCase();

    for (var i = 0; i < array.length; i++) {
        if(string.indexOf(array[i].toLowerCase()) === -1) {
            return false;
        }
    }

    return true;
}

function strContainsAny(string, array) {
    string = string.toLowerCase();

    for (var i = 0; i < array.length; i++) {
        if(string.indexOf(array[i].toLowerCase()) > -1) {
            return true;
        }
    }

    return false;
}

function readURL(file) {
    var reader = new FileReader();

    reader.readAsDataURL(file);

    return reader;
}

function toggleAds() {
    var adEl = $('*[id^="okpop_"]');
    var adsHidden = localStorage.getItem('imla-hide-ad');

    if(adsHidden === 'true') {
        adEl.find('div:nth-child(1) > a:nth-child(1)').click();
    } else {
        adEl.find('a').click(function() {
            localStorage.setItem('imla-hide-ad', 'true');
        });
    }
}

function uploadImageAndGetUrl(postData, callback) {
    $.post(apiUrl + '/upload-image', postData, callback).fail((e) => {
        callback({url: ''});
    });
}

function handleTextareaPaste() {
    $('textarea').pastableTextarea();

    $('textarea').on('pasteImage', function (ev, data) {
        var textarea = $(this);
        NProgress.inc();

        uploadImageAndGetUrl({
            base64: data.dataURL,
            width: data.width,
            height: data.height,
            username: username
        }, function (res) {
            var url = res.url;

            insertOnSelectionPos(textarea, url);
            NProgress.done();
        });
    });
}

$(function () {
    try {
        checkIfDev();

        if (isDev)
            initImladisDev();
        else
            initImladis();
    } catch (e) {
        console.error(e);
        showPage();
    }
});

function showPage() {
    $('body').show();
    $('#punwrap').fadeIn(150);

    NProgress.done();
};

function insertOnSelectionPos(input, text) {
    var cursorPos = input.prop('selectionStart');
    var v = input.val();
    var textBefore = v.substring(0, cursorPos);
    var textAfter = v.substring(cursorPos, v.length);

    input.val(textBefore + text + textAfter);
}

function setupAjax() {
    $.ajaxSetup({
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    });
}

function handleIframeLinks() {
    if (isIframe) { // checking if it is an iframe
        var title = $(document).attr('title');
        var url = $(location).attr('href').split('imladis.p2a.pl')[1];

        window.parent.history.pushState(window.location.pathname, title, url);
    }
}

var chatFullScreen = false;
function toggleRocketChatFullScreen() {
    var container = $('.rocket-chat-container');
    chatFullScreen = !chatFullScreen;

    if (chatFullScreen) {
        $('body').addClass('o-hidden');
        container.addClass('fullscreen');
    } else {
        $('body').removeClass('o-hidden');
        container.removeClass('fullscreen');
    }

    console.log('fullscreen:', fullScreen);
}

var alreadyLoggedIn = false;
function embedRocketChat() {
    console.log('embeding rocketchat');

    $(window).on('load', function () {
        setTimeout(function () {
            $("body").focus()
        }, 100);
    });

    if (username) {
        var imlaToken = localStorage.getItem(username + '-imlaToken');

        if (!imlaToken) {
            imlaToken = Math.random().toString(36).substr(2, 9);
            localStorage.setItem(username + '-imlaToken', imlaToken);
        }

        $.post(apiUrl + '/login', {
            username: username,
            imlaToken: imlaToken
        }, function (data) {
            console.log('rocketchat logged as ' + username);

            embedRocketChatHtml();

            window.addEventListener('message', function (msg) {
                var message = msg.data;

                if (message === 'rocket-chat-login' && !alreadyLoggedIn) {
                    $('#rocket-chat-iframe')[0].contentWindow.postMessage({
                        externalCommand: 'login-with-token',
                        token: data.token
                    }, '*');

                    alreadyLoggedIn = true;
                    console.log('sent login request to rocket chat');
                }

                if (message === 'rocket-chat-fullscreen') {
                    toggleRocketChatFullScreen();
                }

            }, false);
        });
    } else {
        embedRocketChatHtml();
    }
}

function embedRocketChatFixed() {
    if (isIframe) {
        return;
    }

    console.log('embeding rocketchat fixed');

    $(window).on('load', function () {
        setTimeout(function () {
            $("body").focus()
        }, 100);
    });

    if (username) {
        var imlaToken = localStorage.getItem(username + '-imlaToken');

        if (!imlaToken) {
            imlaToken = Math.random().toString(36).substr(2, 9);
            localStorage.setItem(username + '-imlaToken', imlaToken);
        }

        $.post(apiUrl + '/login', {
            username: username,
            imlaToken: imlaToken
        }, function (data) {
            console.log('rocketchat logged as ' + username);

            embedRocketChatFixedHtml();

            window.addEventListener('message', function (msg) {
                var message = msg.data;

                if (message === 'rocket-chat-login' && !alreadyLoggedIn) {
                    $('#rocket-chat-iframe')[0].contentWindow.postMessage({
                        externalCommand: 'login-with-token',
                        token: data.token
                    }, '*');

                    alreadyLoggedIn = true;
                    console.log('sent login request to rocket chat');
                }

                if (message === 'rocket-chat-fullscreen') {
                    toggleRocketChatFullScreen();
                }

            }, false);
        });
    } else {
        embedRocketChatFixedHtml();
    }
}

function embedRocketChatFixedHtml() {
    var globalIframe = $('<iframe id="mainframe" src="' + window.location + '" style="border:none; position: fixed; top: 0; right: 0; width: 70%; height: 100%"></iframe> ');

    var iframe = $('<iframe id="rocket-chat-iframe" class=\'rocket-chat-iframe\' src="http://104.248.131.70:3000/channel/general?layout=embedded" frameborder="0" style="width: 30%; height: 100%; top: 0; left: 0; position: fixed;"></iframe>');

    $('body').html('');
    $('body').append(globalIframe);
    $('body').append(iframe);
}

function isMobile() {
    return $(window).width() < 992 && !isIframe;
}

function embedRocketChatHtml() {
    var iframe = $('<iframe id="rocket-chat-iframe" class=\'rocket-chat-iframe\' src="http://104.248.131.70:3000/channel/general?layout=embedded" frameborder="0"></iframe>');
    var chatContainer = $('<div class="rocket-chat-container" style="min-height: 430px"></div>');
    chatContainer.dblclick(toggleRocketChatFullScreen);
    chatContainer.append(iframe);

    var announce = $('#punindex #announce');

    if (announce) {
        $('div.block:nth-child(2)').after(chatContainer);
        $('#punindex #announce').addClass('rocket-chat-initialized');
    } else {
        $('#brdwelcome').after(chatContainer);
    }
}

function fixDates() {
    moment.locale('pl');

    $('.blocktable a').each(function () {
        var timestamp = fixDatesForEl(this, true, false);

        if(timestamp) {
            $(this).closest('tr').data('timestamp', timestamp);
        }
    });

    $('.blockpost #intertext1 span a').each(function () {
        fixDatesForEl(this, false);
    });

    $('.blockpost h2 > span').each(function () {
        fixDatesForEl(this, false);
    });

    $('#brdwelcome ul.conl > li:nth-child(2)').each(function () {
        fixDatesForEl(this, true);
    });

    $('.postleft dd').each(function () {
        fixDatesForEl(this, true);
    });
}

function reoderForum() {
    $('.blocktable tbody').each(function () {
        var $tbody = $(this);

        $tbody.find('tr').sort(function (a, b) {
            var tda = $(a).data('timestamp'); // target order attribute
            var tdb = $(b).data('timestamp'); // target order attribute
            // if a < b return 1
            return tda < tdb ? 1
                    // else if a > b return -1
                    : tda > tdb ? -1
                    // else they are equal - return 0
                    : 0;
        }).appendTo($tbody);
    });
}

function fixDatesForEl(el, humanOnly, attachTime) {
    var string = $(el).html();
    var re = /(?:(?:\d{4}-\d{2}-\d{2}|Dzisiaj|Wczoraj) \d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2})/gi;
    var matches = string.match(re) || [];
    var timestamp = '';

    matches.forEach((text) => {
        var isToday = text.indexOf('Dzisiaj') !== -1;
        var isYestarday = text.indexOf('Wczoraj') !== -1;

        //Check if date
        var isTodayOrYesterday = isToday || isYestarday;

        var date = '';

        if (isTodayOrYesterday) {
            var missingDate = moment();

            if (isYestarday) {
                missingDate.subtract(1, "days");
            }

            var dayMonthYear = missingDate.format('YYYY-MM-DD');
            var time = text.split(' ')[1];

            date = `${dayMonthYear} ${time}`;
        } else {
            date = text;
        }

        var postDate = moment(date);
        //fixing wrong timezone
        //01:04:03 -> 20:18
        postDate.add(19, 'hours');
        postDate.add(14, 'minutes');

        var postDateString = postDate.format('YYYY-MM-DD HH:mm:ss');

        var finalDate;

        finalDate = getHumanReadableDateDiff(moment(), postDate, humanOnly, attachTime);

        if (finalDate) {
            $(el).html(string.replace(text, finalDate));
            $(el).attr('title', postDateString);
        }

        $(el).parent().find('.byuser').each(function () {
            $(this).html($(this).text().replace('przez ', ''));
        });

        timestamp = postDate.format("X");
    });

    return timestamp;
}

function getHumanReadableDateDiff(a, b, humanOnly, attachTime) {
    if (typeof (attachTime) === 'undefined') {
        attachTime = true;
    }

    var daysFromNow = a.diff(b, 'days');
    var time = b.format('HH:mm');
    var atTime = ` o ${time}`;


    if (daysFromNow === 0) {
        return `Dzisiaj${atTime}`;
    }

    if (daysFromNow === 1) {
        return `Wczoraj${atTime}`;
    }

    if (daysFromNow > 1 && !humanOnly) {
        var format = a.year() === b.year() ? 'DD MMMM' : 'DD MMMM YYYY';

        if (attachTime) {
            format += ' HH:mm';
        }

        return b.format(format);
    }

    return `${b.from(a)}${attachTime ? atTime : ''}`;
}

function parsePrularInteger(integer, o1, o2, o3) {
    if (integer === 1) {
        return o1;
    }

    var prularIntegers = [2, 3, 4];
    var string = integer.toString();
    var lastTwo = string.substring(string.length - 2, 3);

    if (lastTwo.length === 2 && lastTwo[0] === '1') {
        return o3;
    }

    var intToCheck = parseInt(lastTwo.substring(lastTwo.length - 1, 2));

    return prularIntegers.indexOf(intToCheck) !== -1 ? o2 : o3;
}

function appendChatIcon() {
    var button = $('<a href="#" class="chat-icon"><i class="fa fa-comment"></i></a>');
    button.click((e) => {
        e.preventDefault();

        embedRocketChat();

        button.remove();
    });

    $('body').append(button);
}

function initImladis() {
    console.log('init');

    var canContinue = true;

    username = $("a[href*='../profile.php']").html();
    setupAjax();
    // handleIframeLinks();

    // if(!isMobile()) {
    //     $('#announce').addClass('rocket-chat-initialized');
    //
    //     if (!isIframe) {
    //         canContinue = false;
    //     }
    //
    //     embedRocketChatFixed();
    // } else {
    //     onPunClass('punindex', appendChatIcon);
    // }

    if(!canContinue) {
        showPage();
        return;
    }

    parsePosts();
    postMenu();
    handleMenu();
    setFirstButtonAsLatestPosts();
    handleTextareaPaste();
    toggleAds();
    fixDates();

    onPunClass('punviewtopic', handleScroll);
    onPunClass('punviewtopic', handleEditor);
    onPunClass('punpost', handleEditor);
    onPunClass('punedit', handleEditor);
    onPunClass('punindex', getLatest);
    onPunClass('punindex', reoderForum);
    onPunClass('punviewforum', reoderForum);

    showPage();
}

function initImladisDev() {
    console.log('init dev');

    var randomHash = Math.floor(Math.random() * 1000);
    var devUrl = 'http://imladis.local';

    console.log('setting files to localhost');

    $('link[href*="main.css"]').prop('href', `${devUrl}/main.css?${randomHash}`);
    $('link[href*="dark.css"]').prop('href', `${devUrl}/dark.css?${randomHash}`);
    $.getScript(`${devUrl}/main.js`);

    throw new Error("Script stopped, switched to dev");
}

window.onbeforeunload = function (e) {
    NProgress.set(0.4);
};
