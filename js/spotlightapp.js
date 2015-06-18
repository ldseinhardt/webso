/*
  Função que formata em HTML os resultados e que
  faz uma consulta SPARQL para obter resumo, imagem e link da wikipedia
*/
jQuery.fn.toHTML = function(data) {
  var self = this;
  /* Mostra o botão voltar e os dados passados para o spotlight */
  var html = "";
  html += "<button id=\"back\" title=\"Voltar ao inicio\" class=\"btn btn-warning btn-fab btn-raised mdi-navigation-arrow-back\"></button>";
  html += "<h3>Texto recebido:</h3>";
  html += "<div class=\"panel panel-primary\">";
  html += "<div class=\"panel-body\"><p align=\"justify\">"+data["@text"]+"</p></div>";
  html += "</div>";
  html += "<h3>Intervalo de confiança:</h3><br />";
  html += "<span class=\"text-arround\">"+data["@confidence"]+"</span>";
  self.html(html);

  /* Se houve marcações, então busca por resumo, imagem e link da wikipedia */ 
  if(data["Resources"] != undefined) {
    self
      .append("<h3>Recursos:</h3>")
      .append("<div class=\"panel-group\" id=\"accordion-result\" role=\"tablist\" aria-multiselectable=\"true\"></div>");
    $.each(data["Resources"], function(i, resources) {
      /* endpoint SPARQL */
      $.post("http://dbpedia.org/sparql",
        {
          "default-graph-uri": "http://dbpedia.org",
          "query" : "SELECT ?isPrimaryTopicOf ?thumbnail ?abstract WHERE { <" + resources["@URI"] + "> <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?isPrimaryTopicOf . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/thumbnail> ?thumbnail . <" + resources["@URI"] + "> <http://dbpedia.org/ontology/abstract> ?abstract . FILTER (langMatches(lang(?abstract), \"pt\")) . }"
        },
        function(data) {
          var dados = data["results"]["bindings"][0];
          if (dados != null) {
            var resumo = dados["abstract"]["value"];
            var imagem = dados["thumbnail"]["value"];
            var wikipedia = dados["isPrimaryTopicOf"]["value"];
            var html = "";
            html += "<div class=\"panel panel-default\">";
            html += "<div class=\"panel-heading\" role=\"tab\" id=\"heading_"+i+"\">";
            html += "<h4 style=\"display: inline\" id=\"-collapsible-result-group-item-#"+i+"-\" class=\"panel-title\">";
            html += "<a class=\"collapsed\" data-toggle=\"collapse\" data-parent=\"#accordion-result\" href=\"#collapse"+i+"\" aria-expanded=\"false\" aria-controls=\"collapse"+i+"\">";
            html += resources["@surfaceForm"];
            html += "</a>";
            html += "<a class=\"anchorjs-link\" href=\"#-collapsible-result-group-item-#"+i+"-\"><span class=\"anchorjs-icon\"></span></a>";
            html += "</h4>";
            html += "<span class=\"btn-close\" title=\"Excluir\"><i class=\"fa fa-times\"></i></span>";
            html += "</div>";
            html += "<div aria-expanded=\"false\" id=\"collapse"+i+"\" class=\"panel-collapse collapse\" role=\"tabpanel\" aria-labelledby=\"heading"+i+"\">";
            html += "<div class=\"panel-body\">";
            html += "<div class=\"col-md-3\" style=\"text-align: center;\">";
            html += "<img src=\""+imagem+"\"  class=\"img-responsive img-thumbnail\" /><br />";
            html += "<a class=\"btn btn-danger\" style=\"color: #fff\" href="+resources["@URI"]+" target=\"_blank\">DBpedia</a>";
            html += "<a class=\"btn btn-danger\" style=\"color: #fff\" href="+wikipedia+" target=\"_blank\">Wikipédia</a><br />";
            html += "</div>";
            html += "<div class=\"col-md-9\">";
            html += "<p align=\"justify\">"+resumo+"</p>";
            html += "</div>";
            html += "</div>";
            html += "</div>";
            html += "</div>";
            /* Insere o resultado formatado */
            $("#accordion-result", self)
              .append(html);
            /* Abre o primeiro elemento */
            $(".panel-collapse", self)
              .first()
              .collapse('show');
          }
        },
      "json");
    });
  } else {
    /* Exibe uma mensagem se não houver recursos */
    self.append("<p align=\"center\"><br /><i class=\"fa fa-frown-o fa-5x\"></i><br /><br />Desculpe, não há recursos . . .</p>");
  }

  return this;
};

/* Função que chama o Spotlight */
jQuery.fn.spotLight = function(options) {
  var self = this;

  /* Servidor com problemas na rede ufpel */
  //var server = "http://spotlight.sztaki.hu:2222/rest/annotate";

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

  /* Insere o menu de resultados */
  if (!$("#menu-result")[0]) {
    $("#menu-inicio").after("<li id=\"menu-result\"><a class=\"mdi-content-create\" title=\"Resultados\"></a></li>"); 
  }
  $("#menu-inicio").removeClass("active");
  $("#menu-result").addClass("active");

  /* Mostra o icone carregando */
  $(".conteudo").slideUp().promise().always(function() {
    self
      .html("<div class=\"loader\"><svg class=\"circular\"><circle class=\"path\" cx=\"50\" cy=\"50\" r=\"20\" fill=\"none\" stroke-width=\"3\" stroke-miterlimit=\"10\"/></svg></div><p align=\"center\">Aguarde, isso pode demorar um pouco . . .</p>")
      .show();
    /* Envie uma requisição ao spotlight para objter as anotações */
    $.post(server, settings, function (data) {
      self.toHTML(data);
    }, "json").fail(function() {
      self.html("<p align=\"center\"><br /><i style=\"color: #D32F2F\" class=\"fa fa-exclamation-triangle fa-5x\"></i><br /><br />Desculpe, houve um erro de conexão . . .</p>");
    });      
  });

  return this;
};

/* Quando a página carregar */
$(function() {
  /* Inicializa o tema Material Design */
  $.material.init();

  /* Inicializa o tema do botão de arquivo */
  $("#file").bootstrapFileInput();

  /* Configura o slider de confiaça */
  $("#confidence-slider").noUiSlider({
    start: 0.5,
    step: 0.05,
    range: {
      'min': 0,
      'max': 1
    }
  }).on("slide", function() {
      $("#confidence").val($(this).val());
  });

  /* Marca o item do menu selecionado */
  $("#navbar li").click(function() {
    $("#navbar li").removeClass("active");
    $(this).addClass("active");
  });

  /* Menu: Spotlight App Click */
  $("#menu-brand").click(function() {
    $(this).animate({opacity: 0, left: "-=100"}, 2000, function() {
      $(this).animate({opacity: 1, left: "+=100"}, 1000);
    });
  });

  /* Menu: Inicio Click */
  $("#menu-inicio").click(function() {
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow");
  });

  /* Menu: Resultados Click */
  $("#navbar").on("click", "#menu-result", function() {
    $("#navbar li").removeClass("active");
    $(this).addClass("active");
    $(".conteudo").hide();
    $("#conteudo-resultados").slideDown("slow");
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

  /* Botão Enviar, Roda o Spotlight */
  $("#submit").click(function() {
    if($("#collapseOne").css("display") == "block") {
      /* Texto */
      $("#conteudo-resultados").spotLight({
        text: $("#text").val(),
        confidence: $("#confidence").val()
      });
    } else if($("#collapseTwo").css("display") == "block") {
      /* Arquivo */
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

  /* Botão voltar */
  $("#conteudo-resultados").on("click", "#back", function() {
    $(".conteudo").hide();
    $("#conteudo-inicio").slideDown("slow");
  });

  /* Botão para eliminar resultados */
  $("#conteudo-resultados").on("click", ".btn-close", function() {
    var panel = $(this).parent().parent();
    panel.fadeOut("slow", function() {
      var open = $(".panel-collapse", panel).attr("aria-expanded") == "true";
      panel.remove();
      if ($(".panel-collapse", "#accordion-result").length > 0) {
        /* Abre o primeiro elemento, se o elemento fechado estivesse aberto */
        if (open) {
          $(".panel-collapse", "#accordion-result")
            .first()
            .collapse('show');
        }
      } else {
        /* Se não houver mais recursos então vai para o inicio */
        $("#menu-result").remove();
        $("#menu-inicio").addClass("active");
        $(".conteudo").hide();
        $("#conteudo-inicio").slideDown("slow");
      }
    });
  });
});