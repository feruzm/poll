'use strict';

angular.module('steempoll.poll', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/poll/:category/:author/:permlink', {
    templateUrl: 'poll/poll.html',
    controller: 'PollCtrl'
  });
}])

.controller('PollCtrl', function($scope, $routeParams, APIs, $filter, $log, $rootScope, $fancyModal) {
  
  $scope.ptypes = [{id: 0, name: "-"}, {id: 1, name: "poll"}, {id: 2, name: "idea"}, {id: 3, name: "proposal"}, {id: 4, name: "project"}];

  var stripData = function(tt){
    //console.log(tt.body);

    var text = tt.body;
    if (text.indexOf("<div steempoll='")>-1) {
      return text.slice(text.indexOf("<div steempoll='"), text.indexOf("</p><br>")+8);
    } else {
      return "THIS POST DOES NOT HAVE AN EMBEDDED POLL!"
    }
  }
  $scope.castingVote = false;
  $scope.user = {};
  $scope.castVote = function(){
    //console.log($scope.user.choice);
    if($scope.castingVote) {
      $scope.castingVote = false;
    } else {
      $scope.user.finalc = $scope.user.choice.substring(6);
      $scope.user.percent = Number($scope.user.finalc)-1;
      $scope.castingVote = true;
    }
  }
  $scope.confirmVote = function(){
    var wif = steem.auth.isWif($scope.user.wif) ? $scope.user.wif : steem.auth.toWif($scope.user.voter, $scope.user.wif, 'posting');

    steem.broadcast.vote(wif, $scope.user.voter, "steempoll", $scope.totalData[$scope.user.percent].permlink, 10000, function(err, result) {
        //console.log(err, result);
        if (result) {
          $scope.castingVote = false;
          $scope.user.wif = "";
          alert('Voted on Answer: '+$scope.user.finalc);
        }
        if (err) {
          if (err.message.indexOf('already voted')>-1){
            alert('You have already voted on Answer: '+$scope.user.finalc);
          } else if (err.message.indexOf("weight is too")){
            alert("Voting weight is too small, please accumulate more voting power or steem power!")
          } else {
            alert('Error casting Vote!');
          }

        }
    });
  };
  $scope.results = false;
  $scope.showResults = function(){
    if ($scope.results) {
      $scope.results = false;
    } else {
      $scope.results = true;
      //console.log($scope.post.active_votes);
      var siz = $scope.totalData.length;
      
      $scope.rows = {votes:[], stakes:[], reputations:[]};

      for (var i = 0; i < siz; i++) {
        //console.log($scope.totalData[i]);
        $scope.rows.votes[i] = Number($scope.totalData[i].active_votes.length);
        $scope.rows.stakes[i] = Number($scope.totalData[i].net_rshares);
        var sump = 0;
        for (var j = 0; j < $scope.totalData[i].active_votes.length; j++) {
          sump += Number(steem.formatter.reputation($scope.totalData[i].active_votes[j].reputation));
        }
        var x = sump/$scope.totalData[i].active_votes.length;
        $scope.rows.reputations[i] = Number($filter('number')(x, 2));
      }
      //setTimeout(function () {
        //console.log($scope.rows);
        /*angular.forEach($scope.post.active_votes, function(v,k){
          var aper = v.percent/100;
          var ind = Math.floor(aper/per);
          if ($scope.rows[ind]) {
            $scope.rows[ind].c[1].v++;
          }
        })*/
        //console.log($scope.rows);
        $scope.barObject = {
          "chart":{
            //"height":500,
            //"width":500,
            "type":"line"
          },
            "xAxis": {
              "labels": {
                  formatter: function(){ return $scope.poll.choices[this.value].name; }
              }
            },
            "credits": false,
            "plotOptions":{
              "series":{
                "stacking":""
              }
            },
            "series":[{ 
              "name":"Votes",
              "data":$scope.rows.votes,
              "type":"column",
              "id":"s1"
            },{ 
              "name":"Shares",
              "data": $scope.rows.stakes,
              "type":"column",
              "id":"s2"
            },{ 
              "name":"Reputation",
              "data":$scope.rows.reputations,
              "type":"column",
              "id":"s3"
            }],
            "title":{
              "text": ""//$scope.poll.title
            }
          };
        //chart
        /*$scope.barObject = {};
        $scope.barObject.type = "BarChart";
        $scope.barObject.data = {"cols": [
            {id: "t", label: "Net shares", type: "number"},
            {id: "s", label: "Votes", type: "number"}
        ], "rows": $scope.rows};

        $scope.barObject.options = {
            'title': $scope.poll.title
        };*/
        if (!$scope.$$phase){
          $scope.$apply();
        }
      //}, 10);
    }
  }



  $scope.openDiscussion = function(poll, size, parentSelector) {
    
    //console.log(poll);
    var perm = $scope.totalData[poll.id.substring(6)-1].permlink;
    //console.log($scope.totalData[poll.id.substring(6)-1]);
    var pollOp = $scope.totalData[poll.id.substring(6)-1];

    steem.api.getState("tag/@steempoll/"+perm, function(err, res) {
      //console.log("+",res);
      $rootScope.comments = [];
      angular.forEach(res.content, function(v,k){
        v.comments = [];
      });
      angular.forEach(res.content, function(v,k){
        //v.comments = [];
        if (v.parent_author === pollOp.author && v.parent_permlink == pollOp.permlink) {
          $rootScope.comments.push(v);
        } /*else {
          console.log(res.content[v.parent_author+"/"+v.parent_permlink]);
          v.comments.push(res.content[v.parent_author+"/"+v.parent_permlink]);  
        }*/
        if (!$scope.$$phase) {
          $scope.$apply();
        }  
      });
      $rootScope.accounts = res.accounts;

      angular.forEach(res.accounts, function(v,k){
        
        if (typeof v.json_metadata === 'string' || v.json_metadata instanceof String) {
          if (v.json_metadata) {
            v.json_metadata = v.json_metadata?angular.fromJson(v.json_metadata):{};
            var key = v.name;
            if (!v.json_metadata.profile.profile_image) {
              v.json_metadata = {profile: {profile_image: "https://robohash.org/"+v.name+".png?size=48x48"}};
            }
            $rootScope.accounts[key].json_metadata = v.json_metadata;
          } else {
            $rootScope.accounts[key].json_metadata = {profile: {profile_image: "https://robohash.org/"+v.name+".png?size=48x48"}};
          }
        }
      });
      console.log($rootScope.accounts);

      $fancyModal.open({ 
        templateUrl: 'myModalContent.html',
        controller: 'PollCtrl'
      });
      
      //console.log($rootScope.comments)
    });
    
    
  }

  $scope.cancel = function(){
    $fancyModal.close();
  }
  $scope.author = $routeParams.author;
  $scope.category = $routeParams.category;
  $scope.permlink = $routeParams.permlink;
  
  if ($routeParams.permlink) {
    $scope.totalData = [];
    steem.api.getContent($routeParams.author, $routeParams.permlink, function(err, result) {
      if (err) {
        alert('Error fetching post, please reload the page!');
      }
      if (result) {
        //console.log(result)
        result.json_metadata = angular.fromJson(result.json_metadata||{})||{};        

        if (result.body.indexOf("steempoll='")>-1) {
          
          result.body = stripData(result);

          $scope.post = result;
          
          var id = result.body.slice(result.body.indexOf("steempoll='")+11, result.body.indexOf("'></div>"));
          //console.log(id);
            APIs.getPoll(id).then(function(res){
              $scope.poll = res.data;
              //console.log(res.data);

              steem.api.getState("tag/"+"@"+$routeParams.author+"/"+$routeParams.permlink, function(err, result) {
                angular.forEach(result.content, function(v,k){
                  if (v.author =='steempoll') {
                    //console.log(res.data.choices.length);

                    for (var i = 0; i < res.data.choices.length; i++) {
                      //var r = '/^'+res.data.choices[i].name+'$/';

                      var inputString = "\\b" + res.data.choices[i].name.replace(" ", "\\b \\b") + "\\b";
                      if(v.body.toLowerCase().match(inputString.toLowerCase())!==null){
                        $scope.totalData[i] = v;
                      }
                      if (!$scope.$$phase){
                        $scope.$apply();
                      }
                    }
                  }
                });
              });
            });
        } else {
          $scope.user.annon = true;
          result.body = stripData(result);
          $scope.post = result;
        }
      }
      if (!$scope.$$phase){
        $scope.$apply();
      }
    });
  }
});