'use strict';

angular.module('steempoll.polls', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/polls', {
    templateUrl: 'polls/polls.html',
    controller: 'PollsCtrl'
  });
}])

.controller('PollsCtrl', function($scope) {

  //console.log('polls');
  $scope.filter = 'steempoll';

  
  $scope.changeFilter = function(type) {
    $scope.filter = type;
    steem.api.getDiscussionsByCreated({tag:type, limit:100}, function(err, response) {
      //console.log(err, response);
      if (err) {
        alert('Connection issue, please reload the page!');
      }
      if(response) {
        angular.forEach(response, function(v,k){
          //console.log(v);
          v.json_metadata = v.json_metadata?angular.fromJson(v.json_metadata):v.json_metadata;
        });
        console.log(response)
        $scope.list = response;
        if (!$scope.$$phase){
          $scope.$apply();
        }
      }
    });
  };

  $scope.isValid = function(item) {
    return item.body.indexOf("<div steempoll='")>-1;
  }

  $scope.changeFilter($scope.filter);

});
