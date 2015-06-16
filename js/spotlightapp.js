function replaceAll(find, replace, str) { 
  return str.replace(new RegExp(find, 'g'), replace); 
}

jQuery.fn.PARSE = function(data) {
  var self = this;

  $(".conteudo").hide(function() {
    self
      /* Botão voltar */
      .html("<button id=\"back\" class=\"btn btn-default\"><span class=\"fa fa-angle-double-left\"> Voltar<span></button>")
      /* Mostra o texto e o indice de confiança utilizados */
      .append("<h3>Texto recebido:</h3>")
      .append("<p align=\"justify\">"+data["@text"]+"</p>")
      .append("<h3>Intervalo de confiança:</h3>")
      .append("<button class=\"btn btn-sm-default btn-info disabled\">" + data["@confidence"] + "</button>")
      .append("<h2>Recursos:</h2>")
      .slideDown("slow")
      .append("<div class=\"panel-group\" id=\"accordion-result\" role=\"tablist\" aria-multiselectable=\"true\"></div>");
    });
    /* Se houve marcações, então busca por link da wikipedia, imagem e resumo */ 
    if(data["Resources"] != null) {  
      $.each(data["Resources"], function(i, resources) {
        /* endpoint SPARQL */
        var endpoint = "http://dbpedia.org/sparql";     
        $.post(endpoint, {
            "default-graph-uri": "http://dbpedia.org",
            "query" : "SELECT ?isPrimaryTopicOf ?thumbnail ?abstract WHERE { <" + resources["@URI"] + "> <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?isPrimaryTopicOf . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/thumbnail> ?thumbnail . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/abstract> ?abstract . FILTER (langMatches(lang(?abstract), \"pt\")) . }"
          }, function(data) {
            var dados = data["results"]["bindings"][0];
            if (dados != null) {
              var wiki = dados["isPrimaryTopicOf"]["value"];
              var resumo = dados["abstract"]["value"];
              var imagem = dados["thumbnail"]["value"];

              var panel = "";
              panel += "<div class=\"panel panel-default\">";
              panel += "<div class=\"panel-heading\" role=\"tab\" id=\"heading_"+i+"\">";
              panel += "<h4 style=\"display: inline\" id=\"-collapsible-result-group-item-#"+i+"-\" class=\"panel-title\">";
              panel += "<a class=\"collapsed\" data-toggle=\"collapse\" data-parent=\"#accordion-result\" href=\"#collapse"+i+"\" aria-expanded=\"false\" aria-controls=\"collapse"+i+"\">";
              panel += resources["@surfaceForm"];
              panel += "</a>";
              panel += "<a class=\"anchorjs-link\" href=\"#-collapsible-result-group-item-#"+i+"-\"><span class=\"anchorjs-icon\"></span></a>";
              panel += "</h4>";
              panel += "<span class=\"btn-close\"><i class=\"fa fa-times\"></i></span>";
              panel += "</div>";
              panel += "<div aria-expanded=\"false\" id=\"collapse"+i+"\" class=\"panel-collapse collapse\" role=\"tabpanel\" aria-labelledby=\"heading"+i+"\">";
              panel += "<div class=\"panel-body\">";
              panel += "<div class=\"col-md-3\" style=\"text-align: center;\">";
              panel += "<img src=\""+imagem+"\"  class=\"img-responsive img-thumbnail\" />";
              panel += "<a href="+resources["@URI"]+" target=_blank>DBpedia</a><br />";
              panel += "<a href="+wiki+" target=_blank>Wikipédia</a><br />";
              panel += "</div>";
              panel += "<div class=\"col-md-9\">";
              panel += "<p align=\"justify\">"+resumo+"</p>";
              panel += "</div>";
              panel += "</div>";
              panel += "</div>";
              panel += "</div>";
              $("#accordion-result", self).append(panel);
              $(".panel-collapse", self).first().addClass("in");
            }
          },
        "json");        
      });
    }

  return this;
};

jQuery.fn.spotLight = function(options) { 
  var self = this;

  /* Servidor com problemas na rede ufpel */
  //var server = "http://spotlight.sztaki.hu:2222/rest/annotate/";
  
  /* Servidor dbpedia em manutenção */
  var server = "http://spotlight.dbpedia.org/rest/annotate";
  
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

  $(".conteudo").slideUp("slow", function() {
    self
      .html("<p align=\"center\"><i class=\"fa fa-spinner fa-pulse fa-5x\"></i></p>")
      .show();
  });  
    
  $.post(server, settings, function (data) { 
    self.PARSE(data);
	}, "json");
  
  return this; 
};  

$(function() {
  /* Configura o slider de confiaça */ 
  $("#confidence-slider").slider({
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    change: function( event, ui ) {
      $("#confidence").val(ui.value);
    }
  });

  /* Marca o item do menu selecionado */ 
  $("#navbar li").click(function() {
    $("#navbar li").removeClass("active");
    $(this).addClass("active");
  });
  
  /* Menu: Spotlight App Click */
  $("#menu-brand").click(function() {
    
  });
  
  /* Menu: Inicio Click */
  $("#menu-inicio").click(function() {
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow");
  });
  
  /* Menu: Sobre Click */
  $("#menu-sobre").click(function() {
    $(".conteudo").hide();
    $("#conteudo-sobre").slideDown("slow");
  });
  
  /* Menu: Equipe Click */
  $("#menu-equipe").click(function() {
    $(".conteudo").hide();
    $("#conteudo-equipe").slideDown("slow");
  });
  
  /* Botão voltar */
  $("#conteudo-resultados").on("click", "#back", function() {
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow"); 
  });
  
  /* Botão Enviar, Roda o Spotlight */
  $("#submit").click(function() {
    if($("#collapseOne").css("display") == "block") {
      /* text */
      $("#conteudo-resultados").spotLight({
        text: $("#text").val(),
        confidence: $("#confidence").val()
      });
    } else if($("#collapseTwo").css("display") == "block") {
      /* file */
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

  /* Botão para eliminar resultados */
  $("#conteudo-resultados").on("click", ".btn-close", function() {
    var result = $(this).parent().parent();      
    result.fadeOut("slow", function() {
      var results = result.parent();
      result.remove();
      $(".panel-collapse", results).first().addClass("in");
    });
  });
});