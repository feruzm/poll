'use strict';

angular.module('steempoll.new', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/new', {
    templateUrl: 'new/new.html',
    controller: 'NewCtrl'
  });
}])

.controller('NewCtrl', function($scope, APIs) {
  //console.log('new');

  $scope.progress = 0;

  $scope.data = {};
  $scope.data.choices = [{id: 'choice1'}, {id: 'choice2'}];
  $scope.data.types = "0";

  $scope.focus = function(){
    var ol = Object.keys($scope.data);
    $scope.progress = ol.length*25;
  };
  $scope.changeType = function(type) {
    if (type=="1") {
      $scope.placeholderD = "Describe poll, give some background info...";
      $scope.placeholderT = "Title of the poll";
    } else if (type == "2") {
      $scope.placeholderD = "Describe your project idea, give some background info and details";
      $scope.placeholderT = "Title of the project idea";
    } else if (type == "3") {
      $scope.placeholderD = "Describe your project proposal, details, try to give an answer to What, Why, How questions?";
      $scope.placeholderT = "Title of the proposal and solution";
    } else if (type == "4") {
      $scope.placeholderD = "Describe your project, features, progress and funding details";
      $scope.placeholderT = "Title of the project";
    }
    if (!$scope.$$phase) {
      $scope.$apply();
    }
  }
  $scope.addNewChoice = function() {
    var newItemNo = $scope.data.choices.length+1;
    $scope.data.choices.push({'id':'choice'+newItemNo});
  };

  $scope.removeChoice = function() {
    var lastItem = $scope.data.choices.length-1;
    $scope.data.choices.splice(lastItem);
  };
  $scope.result = {};
  $scope.submitPoll = function(){
    if ($scope.data.types!="0" && angular.isDefined($scope.data.title) && angular.isDefined($scope.data.description) && $scope.data.choices.length>1) {

      APIs.addNewPoll($scope.data).then(function(res){
        console.log(res);
        $scope.result = res.data;
        if (res.status === 200){
          console.log('success '+res.data._id);
          var poll_body = "<div steempoll='"+res.data._id+"'></div><h1>"+$scope.data.title+"</h1><p>"+$scope.data.description+"</p><br>";
          $scope.embedding = poll_body;

          $scope.data = {};
        } else {
          alert('failed');
        }
      });
    } else {
      alert('Title, Description and Preference, must be filled! At least 2 options should be added!');
    }
  };
});
