var dyatelApp = angular.module('dyatelApp', [
	'ui.bootstrap',
	'ngRoute',
	'userControllers',
]);

dyatelApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/home',            { templateUrl: '/static/p/home.htm',       controller: 'HomePageCtrl',           title: 'Start page' }).
	when('/phonebook',       { templateUrl: '/static/u/phonebook.htm',  controller: 'PhoneBookCtrl',          title: 'Телефонная книга' }).
	when('/calllist',        { templateUrl: '/static/u/calllist.htm',   controller: 'CallListCtrl',           title: 'История вызовов' }).
	when('/myphone',         { templateUrl: '/static/u/myphone.htm',    controller: 'MyPhoneCtrl',            title: 'Мой телефон' }).
	when('/myabbrs',         { templateUrl: '/static/u/myabbrs.htm',    controller: 'MyAbbrsCtrl',            title: 'Сокращенные номера' }).
	otherwise({ redirectTo: '/home' });
	//$locationProvider.html5Mode( true );
}]);

dyatelApp.factory('Title', function() {
	var title = '';
	return {
		get: function() { return title; },
		set: function(t) { title = t; },
	};
});

dyatelApp.run(['Title', '$rootScope', function(Title, $rootScope) {
	$rootScope.Title = Title;
	$rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
		Title.set(current.$$route.title);
	});
}]);

