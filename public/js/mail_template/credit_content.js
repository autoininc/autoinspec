//Q&A 폼
exports.getData = function(link, info, file){

    return html = '<tr>' + 
                    '<td style="padding:30px 30px 30px 30px;border-bottom:1px solid #f2eeed; background: #ffffff;">' + 
                        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +  
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-bottom: 1%;"><b>Title:</b> Credit report of ' + info[0].name_eng + '</td>' + 
                            '</tr>' + 
                            ((file[0].filename != '') ?
                            '<tr>' + 
                                '<td class="bodycopy" style="color:#153643;font-family:sans-serif;font-size:16px;line-height:22px;padding-top: 2%;"><b>Attached file:</b> ' + 
                                '<a href="' + link + '/download/creditreport_file/' + file[0].id +'" >' + file[0].filename + '</a>' : '') + '</td>' + 
                            '</tr>' + 
                        '</table>' + 
                    '</td>' + 
                '</tr>';
  };