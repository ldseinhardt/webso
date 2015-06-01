function replaceAll(find, replace, str) { 
  return str.replace(new RegExp(find, 'g'), replace); 
}

jQuery.fn.spotLight = function(options) { 
  var self = this;
  
  // servidor com problemas na rede ufpel
  var server = "http://spotlight.sztaki.hu:2222/rest/annotate/";
  // servidor dbpedia em manutenção
  //var server = "http://spotlight.dbpedia.org/rest/annotate";
  //http://tellmefirst.polito.it/ajax_it/rest/classify
  
  var settings = {
    text: "",
    confidence : "0.5", 
    support : "0",
    spotter : "Default",
    disambiguator : "Default",
    policy : "whitelist", 
    types : "",
    sparql : "" 
  }
  
  if(options) {
		$.extend(settings, options);
	}
    
  $.post(server, settings, function (data) { 
    console.log(JSON.stringify(data));
    self
      .html("<button id=\"back\" class=\"btn btn-default\">Voltar</button>")
      //Informações Iniciais
      .append("<h3>Texto recebido:</h3>")
      .append(data["@text"])
      .append("<h3>Intervalo de confiança:</h3>")
      .append("<button class=\"btn btn-sm-default btn-info disabled\">" + data["@confidence"] + "</button>")
      //.append("<h3>Suporte [?]</h3>")
      //.append(data["@support"]) 
      //.append("<h3>Tipos</h3>")
      //.append(data["@types"])
      //.append("<h3>sparql</h3>")
      //.append(data["@sparql"])
      //.append("<h3>policy</h3>")
      //.append(data["@policy"])
      .append("<h2>Recursos:</h2>");
      //.html("<div class=\"row\">");


    if(data["Resources"] != null) {  
      $.each(data["Resources"], function(i, resources) {
        
        var endpoint = "http://dbpedia.org/sparql";    
        
        //{"head":{"link":[],"vars":["object"]},"results":{"distinct":false,"ordered":true,"bindings":[{"object":{"type":"uri","value":"http://en.wikipedia.org/wiki/Formosa_do_Rio_Preto"}}]}}
        
        $.post(endpoint, 
          {
            "default-graph-uri": "http://dbpedia.org",
            "query" : "SELECT ?isPrimaryTopicOf ?thumbnail ?abstract WHERE { <" + resources["@URI"] + "> <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?isPrimaryTopicOf . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/thumbnail> ?thumbnail . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/abstract> ?abstract . FILTER (langMatches(lang(?abstract), \"pt\")) . }"
          },
          function(data) { 
            console.log(JSON.stringify(data));

            var types = "";
            if (resources["@types"] != "") {
              types += "<ul class=\"list-group\">";
              $.each(resources["@types"].split(","), function(i, type) {
                types += "<li class=\"list-group-item\">"+type+"</li>";  
              });
              types += "</ul>";
            }

            var isPrimaryTopicOf = data["results"]["bindings"][0]["isPrimaryTopicOf"]["value"];
            var abstract = data["results"]["bindings"][0]["abstract"]["value"];
            var thumbnail = data["results"]["bindings"][0]["thumbnail"]["value"];

            var panel = "";
            panel += "<div class=\"panel panel-default\">";
            panel += "<div class=\"panel-heading\">";
            panel += resources["@surfaceForm"];
            panel += "</div>";
            panel += "<div class=\"panel-body\">";
            panel += "<div class=\"col-md-3\" style=\"text-align: center;\">";
            panel += "<img src=\""+thumbnail+"\"  class=\"img-responsive img-thumbnail\" />";
            panel += "<a href=" + resources["@URI"] + " target=_blank>DBpedia</a><br />";
            panel += "<a href=" + isPrimaryTopicOf + " target=_blank>Wikipédia</a><br />";
            panel += types;
            panel += "</div>";
            panel += "<div class=\"col-md-9\">";
            panel += "<p align=\"justify\">"+abstract+"</p>";
            panel += "</div>";
            panel += "</div>";
            panel += "</div>";
            self.append(panel);
              //.append("<div class=\"col-sm-6\">")
              //Link para o recusro na DBpedia
              //.append("Página na DBpedia: <a href=" + resources["@URI"] + " target=_blank>" + resources["@URI"] + "</a><br />")
              //Supostamente deveria apontar para a página da Wikipédia, mas retorna Undefined
              //.append("Página na Wikipédia: <a href=" + string + " target=_blank>" + string + "</a><br />")
              //== Estudar variável ==
              //.append("Suporte [?]: " + resources["@support"] + "<br />") 
              //.append("Tipos: " + resources["@types"] + "<br />")
              //Nome exibido do recurso na base de dados
              //.append("Nome Amigável: " + resources["@surfaceForm"] + "<br />")
              //Quantos caracteres contando do início do texto é encontrado a primeira ocorrência do recurso
              //.append("Offset no Texto: " + resources["@offset"] + "<br />")
              //== Estudar variável ==
              //.append("Pontuação de Similaridade: " + resources["@similarityScore"] + "<br />")
              //== Estudar variável ==
              //.append("Porcentagem do Segundo Rank: " + resources["@percentageOfSecondRank"] + "<br />")
              //== Retorna todo o array json; útil para depuração
              //self.append("<p>"+JSON.stringify(data)+"</p>")
              //.append("<hr />");
          },
        "json");        
      });
    }
    //.html("</div>")
	}, "json");
  
    $(".conteudo").slideUp();
    $("#conteudo-resultados").slideDown("slow");
  return this; 
};  

$(function() { 
  $("#confidence-slider").slider({
    value:0.5,
    min: 0,
    max: 1,
    step: 0.05,
    change: function( event, ui ) {
      $("#confidence").val(ui.value);
    }
  });

  // Marca o item do menu selecionado 
  $("#navbar li").click(function() {
    $("#navbar li").removeClass("active");
    $(this).addClass("active");  
  });  
  
  // Menu: Spotlight App Click
  $("#menu-brand").click(function() {
    
  });
  
  // Menu: Inicio Click
  $("#menu-inicio").click(function() { 
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow"); 
  });
  
  // Menu: Sobre Click
  $("#menu-sobre").click(function() { 
    $(".conteudo").hide();
    $("#conteudo-sobre").slideDown("slow");
  });
  
  // Menu: Equipe Click
  $("#menu-equipe").click(function() {  
    $(".conteudo").hide();
    $("#conteudo-equipe").slideDown("slow");
  });
  
  $("#conteudo-resultados").on("click", "#back", function() {
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow"); 
  });
  
  // Run Spotlight
  $("#submit").click(function() {
    if($("#collapseOne").css("display") == "block") {
      //text
      $("#conteudo-resultados").spotLight({
        text: $("#text").val(),
        confidence: $("#confidence").val()
      });
    } else if($("#collapseTwo").css("display") == "block") {
      //link      
    } else if($("#collapseThree").css("display") == "block") {
      //file
      if ($("#file")[0].files[0].type == "text/plain") {
        var reader = new FileReader();
        reader.onload = function() {
          $("#conteudo-resultados").spotLight({
            text: this.result,
            confidence: $("#confidence").val()
          });      
        }
        reader.readAsText($("#file")[0].files[0]);     
      } else {
        alert("formato de arquivo inválido");
      }
    }
  });
});