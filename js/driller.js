$(document).ready(function() {
  getDrillerJson();
  $('body').on('click', 'ul.selector li', function() { updateList(this); });
  $('body').on('click', 'div.selector div.exclude', function() {toggleExclusion(this); });
});

collectParams = function() {
  var query = "";
  $('ul.selector li.entry.selected').each(function() {
    var $e = $(this);
    var value = $e.data('Value');
    if (value) {
      var $p = $e.parent();
      if ($p.hasClass('exclusive')) {
        value = - Math.abs(value);
      } else if ($e.hasClass('map')){
        value = Math.abs(value);
      }
      query += (query === "" ? "" : "&") + $p.attr('id') + "=" + value;
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
  var s = data.Scenarios;
  var title;
  var scenarios = '<ul class="scenario"><li class="numbers">'+data.NoResults+' Scenarios found.<\/li><\/ul>';
  for (var d in data.Scenarios) {
    title = s[d].Title + (s[d].Subtitle === "" ? "" : " &mdash; " + s[d].Subtitle);
    scenarios += "<li>" + title + "<\/li>";
  }
  return scenarios;
};

getGroupInfo = function($e) {
  var category = $e.parent().attr('id') + "Group/";
  var idGetter = getGetterForCategoryType('id', $e.parent());
  var valueGetter = getGetterForCategoryType('value', $e.parent());
  var catId = $e.data('Value');
  var $ul = $('<ul><\/ul>');
  $e.empty().append($ul);
  $.getJSON("http://bohr/driller/" + category + catId, collectParams(), function(data) {
    for (var d in data) {
      $ul.append(getLinkedListEntry('entry' ,idGetter(data[d]), valueGetter(data[d])));
    }
    $e.removeClass("group");
  });
};

updateList = function(item) {
  var $e = $(item);
  var $list = $e.parent();
  if ($e.hasClass('header')) {
    $list.toggleClass('overlay');
    $e.siblings('li.entry').toggleClass('hidden');
    $e.siblings('li.group').toggleClass('hidden');
  } else if ($e.hasClass('entry')) {
    if ($e.hasClass('selected')){
      $e.siblings().toggleClass('hidden');
    } else {
      if (!$list.hasClass('selector')){
        var v = $e.data('Value');
        $list = $list.parent().parent();
        $list.empty().append($e);
        $e.data('Value', v);
      }
      $e.addClass('selected');
      getDrillerJson();
    }
  } else if ($e.hasClass('group')) {
    getGroupInfo($e);
  } else if ($e.hasClass('reset')) {
    $e.siblings('.selected').removeClass('selected');
    getDrillerJson();
  }
};

updateSelector = function(data, f1, f2) {
  var $category = $('#'+f2+'.selector');
  var $selected = $('#'+f2+'.selector li.selected');
  var idGetter = getGetterForCategoryType('id', $category);
  var valueGetter = getGetterForCategoryType('value', $category);
  var dp;

  if ($selected.length > 0) {
    dp = data[f1].Entries[0];
    if (dp.length > 0) {
      $selected.parent()
        .empty()
        .append(getClearFilterEntry())
        .append(getLinkedListEntry('entry selected', idGetter(dp[0]), valueGetter(dp[0])));
    }
    return;
  }

  var noMatch = false;
  var d;
  var $target = $('#' + f2);
  var num = 0;
  $target.empty();
  if (data[f1].Groups !== undefined) {
    var matches;
    var groupId;
    for (d in data[f1].Groups[0]) {
      matches = data[f1].Groups[0][d].Matches;
      groupId = data[f1].Groups[0][d].GroupId;
      num += matches;
      $target.append(getLinkedListEntry('group hidden', groupId, groupId + ' (' + matches + ')'));
    }
    if (data[f1].Groups[1].length > 0) {
      prependMatches(data[f1].Groups[1], $target, valueGetter);
    }
    $target.prepend(getListEntryWithoutValue('header', 'Filter (' + num + ')'));
  } else if (data[f1].Entries !== undefined) {
    num = data[f1].Entries[0].length;
    if (num > 0) {
      $target.append(getListEntryWithoutValue('header', 'Filter (' + num + ')'));
      for (d in data[f1].Entries[0]) {
        dp = data[f1].Entries[0][d];
        $target.append(getLinkedListEntry('entry hidden', idGetter(dp), valueGetter(dp)));
      }
    } else {
      noMatch = true;
    }
    if (data[f1].Entries[1].length > 0) {
      prependMatches(data[f1].Entries[1], $target, valueGetter);
    } else if (noMatch) {
      $target.append(getListEntryWithoutValue('info', 'Nothing...'));
    }
  }
  fixExclusion($target, noMatch);
};

fixExclusion = function($target, hideExclusion) {
  var $siblings = $target.siblings('div.exclude');
  if ($siblings.length > 0) {
    $siblings.toggleClass('hidden', hideExclusion);
    if (hideExclusion) {
      $target.removeClass('exclusive');
    } else if (! $target.hasClass('exclusive')) {
      $siblings.each(function() { this.innerText = '[-]'; });
    }
  }
};

toggleExclusion = function(item) {
  var $e = $(item);
  var $list = $e.siblings('ul.selector');
  var $valueElement = $list.find('li.entry.selected');
  var value = $valueElement.data('Value');
  if (value) {
    $valueElement.data('Value', value * -1);
  }
  $e.text($list.hasClass('exclusive') ? '[-]' : '[+]');
  $list.toggleClass('exclusive');
  getDrillerJson();
};

prependMatches = function(data, $element, valueGetter) {
  for (var d in data) {
    $element.prepend(getListEntryWithoutValue('matches', valueGetter(data[d])));
  }
};

getListEntryWithoutValue = function(c, text) {
  return $('<li class="'+c+'">'+text+'<\/li>');
};

getListEntry = function(c, value, text) {
  var $e = getListEntryWithoutValue(c, text);
  $e.data('Value', value);
  return $e;
};

getLinkedListEntry = function(c, value, text) {
  return getListEntry(c, value, '<a href="#">'+text+'<\/a>');
};

getClearFilterEntry = function() {
  return getListEntryWithoutValue('reset hidden', 'Clear filter');
};

getGetterForCategoryType = function(t, $e) {
  if ($e.hasClass('map')) {
    return t === "id" ? getId : getName;
  } else if ($e.hasClass('games')) {
    return t === "id" ? getId : getGameValue;
  } else {
    return getValue;
  }
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

