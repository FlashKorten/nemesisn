$(document).ready(function() {
  getDrillerJson();
  $('body').on('click', 'ul.selector li', function() { updateList(this); });
  $('body').on('click', 'div.selector div.exclude', function() {toggleExclusion(this); });
});

collectParams = function() {
  var query = "";
  $('ul.selector li.entry.selected').each(function() {
    var p = $(this).parent();
    var value = $(this).find('div.value').text();
    if (value) {
      if (p.hasClass('exclusive')) {
        value = - Math.abs(value);
      } else {
        value = Math.abs(value);
      }
      query += ((query === "") ? "" : "&") + p.attr('id') + "=" + value;
    }
  });
  return query;
};

getDrillerJson = function() {
  $.getJSON("http://bohr/driller/q", collectParams(), function(data){
  updateSelector(data, "Authors", "author");
  updateSelector(data, "Publishers", "publisher");
  updateSelector(data, "Genres", "genre");
  updateSelector(data, "Series", "series");
  updateSelector(data, "Leaders", "leader");
  updateSelector(data, "Games", "game");
  updateSelector(data, "Mechanics", "mechanic");
  updateSelector(data, "Themes", "theme");
  updateSelector(data, "Engines", "engine");
  updateSelector(data, "Sides", "side");
  updateSelector(data, "Parties", "party");
  updateSelector(data, "Latitudes", "latitude");
  updateSelector(data, "Longitudes", "longitude");
  updateSelector(data, "FromYears", "fromYear");
  updateSelector(data, "UpToYears", "upToYear");
  updateSelector(data, "FromRanges", "fromRange");
  updateSelector(data, "UpToRanges", "upToRange");
  $('#info').empty().append(listScenarios(data));
  });
};

listScenarios = function(data) {
  var scenarios = '<ul class="scenario"><li class="numbers">'+data.NoResults+' Scenarios found.<\/li><\/ul>';
  for (var d in data.Scenarios) {
    scenarios += "<li>"+data.Scenarios[d].Title;
    if (data.Scenarios[d].Subtitle !== "") {
      scenarios += "&mdash;"+data.Scenarios[d].Subtitle;
    }
    scenarios += "<\/li>";
  }
  return scenarios;
};

getGroupInfo = function(e) {
  var category = e.parent().attr('id') + "Group/";
  var idGetter;
  var valueGetter;
  if (e.parent().hasClass('map')) {
    idGetter = getId;
    valueGetter = getName;
  } else if (e.parent().hasClass('games')) {
    idGetter = getId;
    valueGetter = getGameValue;
  } else {
    idGetter = getValue;
    valueGetter = getValue;
  }
  var catId = e.find('div.value').text();
  $.getJSON("http://bohr/driller/"+category+catId, collectParams(), function(data) {
    var g = "<ul>";
    for (var d in data) {
      g += '<li class="entry"><div class="value">'+idGetter(data[d])+'<\/div><div class="text"><a href="#">'+valueGetter(data[d])+'<\/a><\/div><\/li>';
    }
    e.removeClass("group");
    e.empty().append(g + "<\/ul>");
  });
};

updateList = function(item) {
  var e = $(item);
  var list = e.parent();
  var hidden_siblings;
  if (e.hasClass('header')) {
    hidden_siblings = e.siblings('.hidden');
    if (hidden_siblings.length > 0) {
      hidden_siblings.removeClass('hidden');
      list.addClass('overlay');
    } else {
      e.siblings('li.entry').addClass('hidden');
      list.removeClass('overlay');
    }
  } else if (e.hasClass('entry')) {
    if (e.hasClass('selected')){
      hidden_siblings = e.siblings('.hidden');
      if (hidden_siblings.length > 0) {
        e.siblings().removeClass('hidden');
      } else {
        e.siblings().addClass('hidden');
      }
    } else {
      while (!list.hasClass('selector')){
        list = list.parent();
      }
      e.addClass('selected');
      list.empty();
      list.append(e);
      list.append(getClearFilterLI());
      getDrillerJson();
    }
  } else if (e.hasClass('group')) {
    getGroupInfo(e);
  } else if (e.hasClass('reset')) {
    e.siblings('.selected').removeClass('selected');
    getDrillerJson();
  }
};

updateSelector = function(data, f1, f2) {
  var category = $('#'+f2+'.selector');
  var selected = $('#'+f2+'.selector li.selected');
  var idGetter;
  var valueGetter;
  var dp;
  if (category.hasClass('map')) {
    idGetter = getId;
    valueGetter = getName;
  } else if (category.hasClass('games')) {
    idGetter = getId;
    valueGetter = getGameValue;
  } else {
    idGetter = getValue;
    valueGetter = getValue;
  }
  if (selected.length > 0 && selected.find('div.value').text() !== "") {
    dp = data[f1].Entries[0][0];
    var result = "";
    if (selected.parent().siblings('div.exclude').length > 0) {
      result += getClearFilterLI();
    }
    result += "<li class='entry selected'><div class='value'>"+idGetter(dp)+"<\/div><div id='text'>"+valueGetter(dp)+"<\/div><\/li>";
    selected.parent().empty().append(result);
    return;
  }

  var g = "";
  var hideExclusion = false;
  var d;
  var target = $('#' + f2);
  if (data[f1].Groups !== undefined) {
    var gr = "";
    var num = 0;
    for (d in data[f1].Groups[0]) {
      num += data[f1].Groups[0][d].Matches;
      gr += "<li class='group hidden'><div class='value'>"+data[f1].Groups[0][d].GroupId+"<\/div><div class='text'><a href='#'>"+data[f1].Groups[0][d].GroupId+"  ("+data[f1].Groups[0][d].Matches+")<\/a><\/div><\/li>";
    }
    g = "<li class='header'><div class='value'><\/div><div class='text'>Filter ("+num+")<\/div><\/li>"+gr;
    if (data[f1].Groups[1].length > 0) {
      g = prependMatches(data[f1].Groups[1]) + g;
    }
  } else if (data[f1].Entries !== undefined) {
    if (data[f1].Entries[0].length > 0) {
      g = "<li class='header'><div class='value'><\/div><div class='text'>Filter ("+data[f1].Entries[0].length+')<\/div><\/li>';
      for (d in data[f1].Entries[0]) {
        dp = data[f1].Entries[0][d];
        g += "<li class='entry hidden'><div class='value'>"+idGetter(dp)+"<\/div><div class='text'><a href='#'>"+valueGetter(dp)+"<\/a><\/div><\/li>";
      }
    } else {
      hideExclusion = true;
    }
    if (data[f1].Entries[1] !== undefined && data[f1].Entries[1].length > 0) {
      console.log("Entries Selected: "+ prependMatches(data[f1].Entries[1]));
      g = prependMatches(data[f1].Entries[1]) + g;
    }
  }
  target.empty().append(g);
  if (target.siblings('div.exclude').length > 0) {
    if (hideExclusion) {
      target.removeClass('exclusive');
      target.siblings('div.exclude').addClass('hidden');
    } else {
      target.siblings('div.exclude').removeClass('hidden');
      if (!target.hasClass('exclusive')) {
        target.siblings('div.exclude').each(function() { this.innerText = '[-]'; });
      }
    }
  }
};

prependMatches = function(e) {
  var g = "";
  for (var d in e) {
    g += "<li class='matches'><div class='text'>" + e[d].Name + "<\/div><\/li>";
  }
  return g;
};

toggleExclusion = function(e) {
  var list = $(e).siblings('ul.selector');
  if (list.hasClass('exclusive')) {
    list.removeClass('exclusive');
    e.innerText = '[-]';
  } else {
    list.addClass('exclusive');
    e.innerText = '[+]';
  }
  getDrillerJson();
};

getId = function(data){
  return data.Id;
};

getName = function(data){
  return data.Name;
};

getValue = function(data){
  return data.Value;
};

getGameValue = function(data){
  return data.Title + (data.Subtitle.length > 0 ? " &mdash; " + data.Subtitle : "");
};

getClearFilterLI = function() {
  return "<li class='reset hidden'><div class='value'><\/div><div class='text'>Clear filter<\/div><\/li>";
};

