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
            var string = data["results"]["bindings"][0]["isPrimaryTopicOf"]["value"];
            var result = "";
            result += ("Página na DBpedia: <a href=" + resources["@URI"] + " target=_blank>" + resources["@URI"] + "</a><br />");
            result += ("Página na Wikipédia: <a href=" + string + " target=_blank>" + string + "</a><br />");
            result += ("Tipos: " + (replaceAll(",", ", ", resources["@types"])) + "<br />");
            result += ("Nome Amigável: " + resources["@surfaceForm"] + "<br />");
            result += ("Offset no Texto: " + resources["@offset"] + "<br />");
            result += ("Pontuação de Similaridade: " + resources["@similarityScore"] + "<br />");
            result += ("Porcentagem do Segundo Rank: " + resources["@percentageOfSecondRank"] + "<br /><hr />");
            self.append("<div class=\"col-md-6\"><h3>" + resources["@surfaceForm"] + "</h3>" + result + "</div>");
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
  
    $(".row").slideUp();
    $("#conteudo-resultados").slideDown("slow");
  return this; 
};  

$(function() { 
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
    $(".row").hide();
    $("#conteudo-inicio").slideDown("slow"); 
  });
  
  // Menu: Sobre Click
  $("#menu-sobre").click(function() { 
    $(".row").hide();
    $("#conteudo-sobre").slideDown("slow");
  });
  
  // Menu: Equipe Click
  $("#menu-equipe").click(function() {  
    $(".row").hide();
    $("#conteudo-equipe").slideDown("slow");
  });
  
  $("#conteudo-resultados").on("click", "#back", function() {
    $(".row").hide();
    $("#conteudo-inicio").slideDown("slow"); 
  });
  
  // Run Spotlight
  $("#submit").click(function() {
    if($("#collapseOne").css("display") == "block") {
      //text
      $("#conteudo-resultados").spotLight({ text: $("#text").val() });
    } else if($("#collapseTwo").css("display") == "block") {
      //link      
    } else if($("#collapseThree").css("display") == "block") {
      //file
      if ($("#file")[0].files[0].type == "text/plain") {
        var reader = new FileReader();
        reader.onload = function() {
          $("#conteudo-resultados").spotLight({ text: this.result });      
        }
        reader.readAsText($("#file")[0].files[0]);     
      } else {
        alert("formato de arquivo inválido");
      }
    }
  });
});