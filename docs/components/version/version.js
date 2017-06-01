'use strict';

angular.module('steempoll.version', [
  'steempoll.version.interpolate-filter',
  'steempoll.version.version-directive'
])

.value('version', '1.0')

.constant('API_END_POINT','http://api.esteem.ws:8080')

.service('APIs', ['$http', '$rootScope', 'API_END_POINT', function ($http, $rootScope, API_END_POINT) {
  'use strict';
  return {
    addPoll: function(poll) {
      return $http.post(API_END_POINT+"/api/polls", {title: poll.title, description: poll.description, choices: poll.choices, preferences: poll.preferences, email: poll.email});
    },
    addNewPoll: function(poll) {
      return $http.post(API_END_POINT+"/api/polls", {title: poll.title, description: poll.description, choices: poll.choices, preferences: poll.types});
    },
    getPoll: function(id) {
      return $http.get(API_END_POINT+"/api/poll/"+id);
    }
  };
}])


.filter('timeago', function($filter, $rootScope) {

  function TimeAgo(input, p_allowFuture) {
    var substitute = function (stringOrFunction, number, strings) {
            var string = angular.isFunction(stringOrFunction) ? stringOrFunction(number, dateDifference) : stringOrFunction;
            var value = (strings.numbers && strings.numbers[number]) || number;
            return string.replace(/%d/i, value);
        }
        var nowTime = (new Date()).getTime();
        var date = (new Date(input+'.000Z')).getTime();
        //refreshMillis= 6e4, //A minute

        // get difference between UTC and local time in milliseconds
        
        //var timeZoneOffset = (new Date().getTimezoneOffset()) * 60000;
        
        // convert local to UTC
        //console.log(timeZoneOffset);

        /*if (timeZoneOffset != 0) {
          nowTime = nowTime + timeZoneOffset;
        }*/

        var allowFuture = p_allowFuture || false,
        strings= {
            prefixAgo: '',
            prefixFromNow: '',
            suffixAgo: 'ago',
            suffixFromNow: 'from now',
            seconds: 'secs',
            minute: 'a min',
            minutes: "%d "+'mins',
            hour: 'an hour',
            hours: "%d "+'hours',
            day: 'a day',
            days: "%d "+'days',
            month: 'a month',
            months: "%d "+'months',
            year: 'a year',
            years: "%d "+'years'
        },
        dateDifference = nowTime - date,
        words,
        seconds = Math.abs(dateDifference) / 1000,
        minutes = seconds / 60,
        hours = minutes / 60,
        days = hours / 24,
        years = days / 365,
        separator = strings.wordSeparator === undefined ?  " " : strings.wordSeparator,

        prefix = strings.prefixAgo,
        suffix = strings.suffixAgo;
        
        //console.log(timeZoneOffset);

    if (allowFuture) {
        if (dateDifference < 0) {
            prefix = strings.prefixFromNow;
            suffix = strings.suffixFromNow;
        }
    }

    words = seconds < 45 && substitute(strings.seconds, Math.round(seconds), strings) ||
    seconds < 90 && substitute(strings.minute, 1, strings) ||
    minutes < 45 && substitute(strings.minutes, Math.round(minutes), strings) ||
    minutes < 90 && substitute(strings.hour, 1, strings) ||
    hours < 24 && substitute(strings.hours, Math.round(hours), strings) ||
    hours < 42 && substitute(strings.day, 1, strings) ||
    days < 30 && substitute(strings.days, Math.round(days), strings) ||
    days < 45 && substitute(strings.month, 1, strings) ||
    days < 365 && substitute(strings.months, Math.round(days / 30), strings) ||
    years < 1.5 && substitute(strings.year, 1, strings) ||
    substitute(strings.years, Math.round(years), strings);
    //$rootScope.log(prefix+words+suffix+separator);
    prefix.replace(/ /g, '')
    words.replace(/ /g, '')
    suffix.replace(/ /g, '')
    return (prefix+' '+words+' '+suffix+' '+separator);

  };

  TimeAgo.$stateful = true;
  return TimeAgo;
})

.filter('parseUrl', function($sce, $rootScope) {
    //var urls = /(\b(https?|ftp):\/\/[A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_|])/gim;
    //var emails = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    var imgs = /(https?:\/\/.*\.(?:tiff?|jpe?g|gif|png|svg|ico))(.*)/gim;
    var img = /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg))/gim;
    var imgd = /src=\"([^\"]*)\"/gim;

    //var youtube = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    //var youtubeid = /(?:(?:youtube.com\/watch\?v=)|(?:youtu.be\/))([A-Za-z0-9\_\-]+)/i;

    return function(textu, subpart) {
      var options = {
        gfm: true,
        tables: true,
        smartLists: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false
      };
      if (textu.body || textu.comment) {
        var s = textu.body||textu.comment;
        var texts = marked(s, options);
        //console.log(textu);
        //console.log('after '+texts);
        if (subpart) {
          var s = $sce.trustAsHtml(texts).toString();
          var text = s.substring(s.indexOf("<p>"), s.indexOf("</p>"));
          return text;
        } else {
          return $sce.trustAsHtml(texts);
        }
      }
    };
})
.filter('reputation', function(){
  return function(value, bool) {
    var reputation_level = 1;
    var neg = false;

    if (value < 0)
      neg = true;

    if (value != 0) {
      reputation_level = Math.log10(Math.abs(value));
      reputation_level = Math.max(reputation_level - 9, 0);

      if (reputation_level < 0)
        reputation_level = 0;
      if (neg)
        reputation_level *= -1;

      reputation_level = (reputation_level*9) + 25;
    } else {
      return 0;
    }

    return bool?reputation_level:Math.floor(reputation_level);
  }
})
.directive('ionComment', ionComment)
.directive('ionThread', ionThread);

function ionComment() {
  return {
    restrict: 'E',
    scope: {
        comment: '='
    },
    template: '<div ng-if="comment.author" class="ion-comment card">\
                <div class="ion-comment--author"><img class="round-avatar" ng-src="{{$root.accounts[comment.author].json_metadata.profile.profile_image}}"/><b><a href="https://steemit.com/@{{comment.author}}" target="_blank">{{comment.author}}</a></b>&nbsp;<div class="reputation">{{comment.author_reputation|reputation|number:0}}</div>&middot;{{comment.created|timeago}}</div>\
                <div class="ion-comment--score"></div>\
                <div class="ion-comment--text bodytext selectable" ng-bind-html="comment | parseUrl "></div>\
                <div class="ion-comment--replies"><span>{{comment.net_votes || 0}} votes</span> | <span ng-click="toggleComment(comment)">{{comment.children || 0}} replies</span></div>\
            </div>',
    controller: function($scope, $rootScope) {
      $scope.toggleComment = function(comment) {
          
        console.log('toggleComment '+comment.showChildren);

        if (comment.showChildren) {
          comment.showChildren = false;
        } else {
          console.log(comment.author, comment.permlink);
          comment.showChildren = true;
          window.steem.api.getState('tag/@'+comment.author+'/'+comment.permlink, function(err, dd) {
            //console.log(dd);
            var po = [];

            angular.forEach(dd.content, function(v,k){
              if (v.parent_author==comment.author && v.parent_permlink == comment.permlink) {
                po.push(v);
              }
            });
            
            angular.forEach(dd.accounts, function(v,k){
              
              if (typeof v.json_metadata === 'string' || v.json_metadata instanceof String) {
                if (v.json_metadata) {
                  if (v.json_metadata.indexOf("created_at")>-1) {
                    v.json_metadata = angular.fromJson(angular.toJson(v.json_metadata));  
                  } else {
                    v.json_metadata = v.json_metadata?angular.fromJson(v.json_metadata):{};
                  }
                  var key = v.name;
                  $rootScope.accounts[key].json_metadata = v.json_metadata;
                }
              }
            });
            
            comment.comments = po;
            comment.showChildren = true;
            $scope.$applyAsync();
          });
        }
      };
    }
  }
}

function ionThread() {
  return {
    restrict: 'E',
    scope: {
        comments: '='
    },
    //Replace ng-if="!comment.showChildren" with ng-if="comment.showChildren" to hide all child comments by default
    //Replace comment.data.replies.data.children according to the API you are using | orderBy:\'-net_votes\'
    template: '<script type="text/ng-template" id="node.html">\
                    <ion-comment comment="comment">\
                    </ion-comment>\
                    <div class="reddit-post--comment--container">\
                         <ul ng-if="comment.showChildren" class="animate-if ion-comment--children">\
                            <li ng-repeat="comment in comment.comments | orderBy:\'-pending_payout_value\' track by $index ">\
                                <ng-include src="\'node.html\'"/>\
                            </li>\
                        </ul>\
                    </div>\
                </script>\
                <div ng-if="comments && comments.length > 0">\
                  <ul>\
                    <li ng-repeat="comment in comments | orderBy:\'-pending_payout_value\' track by $index">\
                        <ng-include src="\'node.html\'"/>\
                    </li>\
                  </ul>\
                </div>',
    controller: function($scope, $rootScope) {

    }
  }
}

function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;   
}

;
