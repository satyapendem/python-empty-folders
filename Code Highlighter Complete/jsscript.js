var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: false,
  highlightMatches: true,
  stylesheet: "lib/jscolors.css",
  indentUnit: 4
});
editor.focus();
editor.setSize(540, 200);
var editor1 = CodeMirror.fromTextArea(document.getElementById("code_update"), {
  lineNumbers: false,
  highlightMatches: true,
  stylesheet: "lib/jscolors.css",
  indentUnit: 4
});
editor1.focus();
editor1.setSize(540, 200);
   //Adding code to div
   //$("#save").hide();
   //$("#edit").hide();
   // $('#buttons').hide();
   $(document).on('mouseenter', '.code', function () {
    $(this).find(".pre_icons").show();
  });
   $(document).on("mouseleave", ".code", function() {
     $(this).find(".pre_icons").hide();
   });
   $("#show").click(function(){
     $('#myModal').modal('hide');
     //$("#save").show();
     //$("#edit").show();
     // $('#buttons').show();
     var program=editor.getValue();
     var code_div = document.getElementsByClassName("code");
     var icon = $("#buttons");
     if($(code_div).children().length<1){
      $(code_div).append(program);
      console.log("if");
    }
    else{
      code_div = document.createElement('div');
      code_div.setAttribute('class','code');
      // code_div.setAttribute('id',ids);
      code_div.innerHTML = program;
      $(".code").last().after(code_div);
      // $("#"+ids).append(new_ele);
      console.log("else");
    }
    $(code_div).each(function() {
      debugger;
      var $this = $(this),
      $code = $this.html(),
      $unescaped = $('<div/>').html($code).text();
      $this.empty();
      CodeMirror(this, {
        value: $unescaped,
        lineNumbers: true,
        theme: "neo",
        readOnly: "nocursor"
      });   
    });

    new_ele = $('.pre_icons').clone();
     //new_ele.removeAttr('id');
     $(code_div).append(new_ele);
     /*Click events for edit and download*/
     
     $('.edit').click(function(event){
      $('#edit_modal').modal('show');
       edit_div=$(this).parents('div.pre_icons').siblings('div.CodeMirror').find('div.CodeMirror-code');
       edit_code = $(edit_div).clone();
       content_code = $(edit_code).find('div.CodeMirror-linenumber').remove();
       txt_for_update=$(edit_code).text();
       console.log(txt_for_update);
       editor1.setValue(txt_for_update);
      });
      $('#update_code').click(function(){
        $('#edit_modal').modal('hide');
        console.log("updated clicked");
        console.log(edit_div);
        updated_text=editor1.getValue();
        $(edit_div).text(updated_text);
           //$(code_div).innerHTML(txt_for_update);
        });
     $('.save').click(function(){
      down_div=$(this).parents('div.pre_icons').siblings('div.CodeMirror').find('div.CodeMirror-code');
      down_code = $(down_div).clone();
      console.log(down_code);
      content_code = $(down_code).find('div.CodeMirror-linenumber').remove();
      txt_for_down=$(down_code).text();
      console.log(txt_for_down);
      var type=document.getElementById('language');
      type=type.options[type.selectedIndex].value;
      file_name=document.getElementById('fileName').value;
      console.log(file_name);
      if(file_name==""){
        file_para="program";
      }
      else{
        file_para=file_name;
      }
      switch(type){
        case "c": saveTextAsFile(file_para,"c");
        break;
        case "java": saveTextAsFile(file_para,"java");
        break;
        case "c++": saveTextAsFile(file_para,"cpp");
        break;
        case "php": saveTextAsFile(file_para,"php");
        break;
        case "markdown": saveTextAsFile(file_para,"md");
        break      
        case "plaintext": saveTextAsFile(file_para,"txt");
        break      

      }
      function saveTextAsFile(file,type){
        var textToWrite = txt_for_down;
        var textFileAsBlob = new Blob([textToWrite],{
          type:'text/plain'
        });
        var fileNameToSaveAs =file+"."+type;
        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        if (window.URL != null){
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        }
        else{
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
          downloadLink.onclick = destroyClickedElement;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
        }
        downloadLink.click();
       }
     });
    });

   


