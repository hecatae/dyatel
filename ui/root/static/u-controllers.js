angular.module('dyatelServices', [], function($provide) {
	$provide.factory('CTI', ['$http', '$rootScope', function($http, $rootScope) {
		var inst = {

			newCall: function(num) {
				console.log('CTI.newCall(' + num + ') called');
				var postdata = {
					called: num,
					linehint: 'xz',
				};
				return $http({
					method: 'POST',
					url: '/u/cti/call',
					data: $.param(postdata),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				}).success(function(data) {
					console.log('Call result: ' + angular.toJson(data));
				});
			},

			transferCall: function(chan, num) {
				return $http({
					method: 'POST',
					url: '/u/cti/transfer',
					data: $.param({ chan: chan, target: num }),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				});
			},

			transferChan: function(chan, other) {
				return $http({
					method: 'POST',
					url: '/u/cti/transfer2',
					data: $.param({ chan: chan, target: other }),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				});
			},

			conference: function(chan, other) {
				return $http({
					method: 'POST',
					url: '/u/cti/conference',
					data: $.param({ chan: chan, target: other }),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				});
			},

			eventHandler: function(name, handlerFunc, stateFunc) {
				var es = new EventSource('/u/eventsource/' + name, { withCredentials: true });
				es.addEventListener('message', function (e) {
					if(e.data === 'keepalive')
						return;
					if(e.data === 'testevent') {
						console.log('Got testevent');
						return;
					}
//					console.log('Got notification from server: ' + e.data);
					var d = JSON.parse(e.data);
					if(handlerFunc) {
						$rootScope.$apply(function() {
							handlerFunc(d);
						});
					}
					if(d.event) {
						$rootScope.$broadcast(d.event, d);
					}
				});
				if(stateFunc) {
					es.onopen = function() {
						$rootScope.$apply(function() {
							stateFunc(true);
						});
					};
					es.onerror = function() {
						$rootScope.$apply(function() {
							stateFunc(false);
						});
					};
				}
				return es;
			},

		};
		return inst;
	}]);
});

var ctrlrModule = angular.module('userControllers', [ 'ngGrid', 'dyatelServices', 'dyatelCommon',
	'pascalprecht.translate',
]);

ctrlrModule.controller('NavbarCtrl', [ '$scope', '$rootScope', '$http', '$translate', function($scope, $rootScope, $http, $translate) {
	$http.get('/id').success(function(data) {
		$scope.user = data;
	});
	$http.get('/u/conf/ui').success(function(data) {
		$rootScope.conf = data.params;
		if(! $translate.use())
			$translate.use($rootScope.conf.language);
	});
	$scope.setLanguage = function(lang) {
		$translate.use(lang);
	};
}]);

ctrlrModule.directive('fullscreen', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {
		},
		link: function (scope, element, attrs, model) {
			var el = document.documentElement;
			var rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;
			var cfs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
			if(rfs && cfs) {
				scope.fs = function(st) {
					if(st)
						rfs.call(document.documentElement);
					else
						cfs.call(document);
				};
			}
		},
		template: '<i ng-click="toggle()" title="{{title | translate}}" ng-class="{\'flaticon-fullscreen2\':state, \'flaticon-fullscreen3\':!state}"></i>',
		controller: function($scope) {
			$scope.state = false;
			$scope.title = 'FullScreenEnter';
			$scope.toggle = function() {
				$scope.state = !$scope.state;
				if($scope.fs)
					$scope.fs($scope.state);
				$scope.title = $scope.state ? 'FullScreenExit' : 'FullScreenEnter';
			};
		},
	};
});

ctrlrModule.controller('CallDlgCtrl', function($http, $scope, $modalInstance, $timeout, CTI, num, activeCall, usage) {
	$scope.num = num;
	$scope.activeCall = activeCall;
	$scope.infstatus = 'Loading...';
	$scope.log = 'ok\n';
	var targetIsAChannel = -1 !== $scope.num.indexOf('/');
	$scope.buttons = { };

	var focusId;
	if(! targetIsAChannel) {
		$scope.buttons.call = function() {
			CTI.newCall($scope.num);
			$modalInstance.close('call');
		};
		focusId = '#btn-call';
	}
	if($scope.activeCall) {
		$scope.log += 'Active call: ' + angular.toJson($scope.activeCall) + "\r\n";
		$scope.buttons.transfer = function() {
			if(targetIsAChannel)
				CTI.transferChan($scope.activeCall.chan, $scope.num);
			else
				CTI.transferCall($scope.activeCall.chan, $scope.num);
			$modalInstance.close('transfer');
		};
		if(usage === 'dnd')
			focusId = '#btn-transfer';
	}
	if(targetIsAChannel) {
		$scope.buttons.conference = function() {
			CTI.conference($scope.activeCall.chan, $scope.num);
			$modalInstance.close('conf');
		};
	}
	$scope.btnCancel = function () {
		$modalInstance.dismiss('cancel');
	};
	$scope.log += 'Buttons: ' + angular.toJson($scope.buttons) + "\r\n";
	$timeout(function () {
		$(focusId).focus();
	});

	$http.get('/u/phonebook/info/' + $scope.num).success(function(data) {
		$scope.info = data.result[0];
		$scope.log += 'Loaded info, typeof=' + typeof($scope.info) + "\r\n";
		$scope.infstatus = 'here';
	}).error(function(data, status) {
		$scope.infstatus = 'No info';
		$scope.log += 'Error ' + status + ' loading directory info: ' + data + "\r\n";
		/*
		 * TODO:
		 *  Search dossier
		 *  Geographical info
		 */
	});

	$scope.updateStatus = function() {
		$http.get('/u/linetracker/status/' + $scope.num).success(function (data) {
			$scope.status = data.data;
		});
	};

	$scope.es = CTI.eventHandler('num%20' + $scope.num, function(msg) {
		$scope.updateStatus();
	}, function(state) {
		// XXX repport event stream status somehow
	});
	$scope.updateStatus();

});

ctrlrModule.controller('HomePageCtrl', function($scope, $http, $modal, $timeout, CTI) {
	$scope.phone = '';
	$scope.linetracker = [ ];
	$scope.blfs = [ ];
	$scope.connected = false;
	$scope.current = {
		incomingcall: false,
		activecallid: '',
		msgid: null,
	};

	$scope.selectionDone = function (item) {
		$scope.phone = item.num;
		$scope.doCall(item);
	};
	$scope.dataSource = function (a) {
		var url = '/u/phonebook/search?' + $.param({ q: a, loc: 1, more: 1, pvt: 1, com: 1 }, true); // use jQuery to url-encode object
		return $http.get(url).then(function (response) {
			return response.data.result.map(function(a) { return {
				num: a.num,
				label: a.num + ' ' + a.descr,
			}});
		});
	};
	$scope.doCall = function(o) {
		if(! o.num.length)
			return;
		var modalInstance = $modal.open({
			templateUrl: '/static/u/calldialog.htm',
			controller: 'CallDlgCtrl',
			resolve: {
				num: function () { return o.num; },
				activeCall: function () { return $scope.linetracker.length ? $scope.linetracker[0] : null; },
				usage: function() { return o.op; },
			},
		});
		//alert('call: ' + angular.toJson(o));
		return false;
	};

	$scope.updateLinetracker = function() {
		$http.get('/u/linetracker').success(function (data) {
			$scope.linetracker = data.rows;
			$scope.current.incomingcall = false;
			var lines = { };
			$scope.linetracker.forEach(function(e) {
				lines[e.billid] = e;
				if(e.status === 'ringing' && e.direction === 'outgoing') {
					$scope.current.activecallid = e.billid;
					$scope.current.incomingcall = true;
				}
			});
			$scope.lines = lines;
			if(! $scope.current.activecallid) {
				if($scope.linetracker.length)
					$scope.current.activecallid = $scope.linetracker[0].billid;
				else
					$scope.current.activecallid = '';
			}
		});
	};
	$scope.updateBLFs = function() {
		$http.get('/u/cti/blfs').success(function (data) {
			$scope.blfs = data.rows;
		});
	};
	$scope.updateRegs = function() {
		$http.get('/u/linetracker/devices').success(function(data) {
			$scope.devices = data.rows;
		});
	};

	$scope.updateLinetracker();
	$scope.updateBLFs();
	$scope.updateRegs();

	$scope.es = CTI.eventHandler('home', function(msg) {
		if(msg.event === 'linetracker')
			$scope.updateLinetracker();
		else if(msg.event === 'blf_state')
			$scope.updateBLFs();
		else if(msg.event === 'regs')
			$scope.updateRegs();
	}, function(state) {
		$scope.connected = state;
		if(state)
			$timeout.cancel($scope.testEventTimeout);
	});

	// Connection loopback test
	$scope.testEvent = function() {
		return $http({
			method: 'POST',
			url: '/u/eventsource/testevent',
			data: $.param({ event: 'testevent' }),
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).success(function(data) {
		});
	};
	$scope.testEventTimeout = $timeout(function() {
		if(! $scope.connected)
			$scope.testEvent();
	}, 500);

	// Calls drag-and-drop support
	$scope.onDrop = function(obj, what, target) {
		console.log('Dropped ' + obj.direction + ' channel ' + obj.chan + ' on ' + what + ' ' + target);
		var modalInstance = $modal.open({
			templateUrl: '/static/u/calldialog.htm',
			controller: 'CallDlgCtrl',
			resolve: {
				num: function () { return target; },
				activeCall: function () { return obj; },
				usage: function() { return 'dnd' },
			},
		});
	};

	// Call list
	$scope.section = 'all';
	$scope.calls = { };
	$scope.updateCallList = function() {
		$http.get('/u/cdr/list/' + $scope.section + '?limit=30').success(function(data) {
			$scope.calls[$scope.section] = data.rows;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		});
	};
	$scope.setSection = function(s) {
		$scope.section = s;
		$scope.updateCallList();
	};
	$scope.reCall = function(row) {
		$scope.doCall({num: ('outgoing' === row.direction ? row.caller : row.called), op: 'clst'});
	};
	$scope.updateCallList();

	// Call log
	$scope.updateCallLog = function() {
		$http.get('/u/calllog/call/' + $scope.current.activecallid + '/list').success(function(data) {
			data.rows.reverse();
			$scope.calllog = data.rows;
		});
	};
	$scope.editMsg = function(index) {
		$scope.current.msgid = $scope.calllog[index].id;
		$scope.addNote = true;
	};
	$scope.delMsg = function(index) {
		$http({
			method: 'POST',
			url: '/u/calllog/call/' + $scope.current.activecallid + '/record/' + $scope.calllog[index].id,
			data: $.param({ text: '' }), // XXX depends on jQuery
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		});
	};
	$scope.addNote = false;
	$scope.$watch('current.activecallid', $scope.updateCallLog);
	$scope.$on('calllog', $scope.updateCallLog);
});
ctrlrModule.directive('callTime', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {
		},
		link: function ($scope, element, attrs, model) {
			attrs.$observe('time', function(secs) {
				$scope.secs = parseInt(secs);
				$scope.ts = new Date();
			});
		},
		template: '<div style="display:inline-block; width:6em; border:2px solid #CCC; background-color:#EEE; text-align:center; font-family:monospace; font-weight:bold;">{{time}}</div>',
		controller: function($scope, $timeout) {
			$scope.dots = true;
			$scope.updateTime = function() {
				var now = new Date();
				var s = $scope.secs + Math.floor((now - $scope.ts) / 1000);
				var min = Math.floor(s / 60);
				var sec = s - min * 60;
				if(sec < 10)
					sec = '0' + sec;
				$scope.time = min + ($scope.dots ? ':' : ' ') + sec;
				$scope.dots = !$scope.dots;
				$timeout($scope.updateTime, 500);
			};
			$scope.updateTime();
		},
	};
});

ctrlrModule.directive('editNote', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {
			cls: '@class',
		},
		link: function (scope, element, attrs, model) {
			attrs.$observe('callid', scope.onCallIdChanged);
			attrs.$observe('msgid', scope.onMsgIdChanged);
		},
		template: '<textarea class="{{cls}}" ng-class="{changed:to}" ng-model="text" ng-change="textUpdate()" placeholder="Add note"></textarea>',
		controller: function($scope, $http, $timeout) {
			$scope.id = null;
			$scope.text = '';
			$scope.callid = null;
			$scope.onCallIdChanged = function(val) {
				$scope.flush(true);
				$scope.callid = val;
			};
			$scope.onMsgIdChanged = function(val) {
				$scope.flush(true);
				$scope.id = val;
				if($scope.id) {
					$http({
						method: 'GET',
						url: '/u/calllog/call/' + $scope.callid + '/record/' + $scope.id,
					}).success(function(data) {
						$scope.text = data.row.value
					});
				}
			};
			$scope.textUpdate = function() {
				if($scope.to)
					$timeout.cancel($scope.to);
				$scope.to = $timeout(function() { $scope.save(); }, 1000);
			};
			$scope.flush = function(clear) {
				if($scope.to)
					$timeout.cancel($scope.to);
				if($scope.to && $scope.text)
					$scope.save();
				if(clear) {
					$scope.text = '';
					$scope.id = null;
				}
			};
			$scope.save = function() {
				$http({
					method: 'POST',
					url: '/u/calllog/call/' + $scope.callid + '/record/' + $scope.id,
					data: $.param({ text: $scope.text }), // XXX depends on jQuery
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				}).success(function(data) {
					if(! $scope.id)
						$scope.id = data.row.id;
					delete $scope.to;
				});
			};
		},
	};
});

ctrlrModule.controller('PhoneBookCtrl', function($scope, $http, $timeout, CTI) {
	$scope.filterOptions = {
		filterText: "",
		useExternalFilter: true,
		cb_local: true,
		cb_more: true,
		cb_private: true,
		cb_common: true,
	};
	$scope.pagingOptions = {
		totalServerItems: 0,
		pageSizes: [5, 10, 20],
		pageSize: 5,
		currentPage: 1
	};

	$scope.getData = function() {
		var url = '/u/phonebook/search?' + $.param({
			q: $scope.filterOptions.filterText,
//			p: $scope.pagingOptions.currentPage,
//			pp: $scope.pagingOptions.pageSize,
			loc: $scope.filterOptions.cb_local ? 1 : 0,
			more: $scope.filterOptions.cb_more ? 1 : 0,
			pvt: $scope.filterOptions.cb_private ? 1 : 0,
			com: $scope.filterOptions.cb_common ? 1 : 0,
		}, true); // use jQuery to url-encode object
		$http.get(url).success(function(data) {
			$scope.pagingOptions.totalServerItems = data.rows;
			$scope.myData = data.result;
		});
	};
	$scope.updateResults = function() {
		//$scope.getData();
		if($scope.getDataTimeout)
			$timeout.cancel($scope.getDataTimeout);
		$scope.getDataTimeout = $timeout(function() {
			$scope.getData();
		}, 500);
		$scope.$on('$destroy', function() {
			$timeout.cancel($scope.getDataTimeout);
		});
	};

	$scope.call = function(arg) {
		CTI.newCall(arg);
	};

	$scope.$watch('pagingOptions', function (newVal, oldVal) {
		if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
			$scope.updateResults();
		}
	}, true);
	$scope.$watch('filterOptions', function (newVal, oldVal) {
		if (newVal !== oldVal) {
			$scope.updateResults();
		}
	}, true);

	$scope.getData();

	$scope.selection = [ ];
	$scope.gridOptions = {
		data: 'myData',
		columnDefs: [
			{ field: 'descr', displayName: 'Description' },
			{ field: 'num', displayName: 'Number' },
			{ displayName: 'Action', cellTemplate: '<span>{{row.getProperty(\'src\')}} {{row.getProperty(\'numkind\')}} <button ng-click="call(row.getProperty(\'num\'))">Call</button></span>' },
		],
//		enablePaging: true,
//		showFooter: true,
		totalServerItems:'pagingOptions.totalServerItems',
		pagingOptions: $scope.pagingOptions,
		filterOptions: $scope.filterOptions,
		multiSelect: false,
		selectedItems: $scope.selection,
	};
});

function TodayMidnightISODateString(d){
	function pad(n){return n<10 ? '0'+n : n}
	return d.getUTCFullYear()+'-'
		+ pad(d.getUTCMonth()+1)+'-'
		+ pad(d.getUTCDate())
		+' 00:00:00';
}

ctrlrModule.controller('CallListCtrl', function($scope, $http) {
	$scope.filter = { datefrom:TodayMidnightISODateString(new Date), empty: true };
	$scope.section = 'all';
	$scope.selection = [ ];
	$scope.calllog = [ ];
	$scope.totalServerItems = 0;
	$scope.pagingOptions = {
		pageSizes: [50, 100, 200, 500],
		pageSize: 50,
		currentPage: 1
	};
	$scope.getData = function(pageSize, page) {
		var query = $.param($scope.filter, true); // use jQuery to url-encode object
		$http.get('/u/cdr/list/' + $scope.section + '?page=' + $scope.pagingOptions.currentPage + '&perpage=' + $scope.pagingOptions.pageSize + '&' + query).success(function(data) {
			$scope.myData = data.rows;
			$scope.totalServerItems = data.totalrows;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		});
	};
	$scope.$watch('pagingOptions', function (newVal, oldVal) {
		if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
			$scope.getData();
		}
	}, true);
	$scope.$watch('selection', function (newVal, oldVal) {
		if (newVal[0] && newVal[0].billid) {
			$http.get('/u/calllog/call/' + newVal[0].billid + '/list').success(function(data) {
				$scope.calllog = data.rows;
			});
		} else {
			$scope.calllog = [ ];
		}
	}, true);
	$scope.setSection = function(s) {
		$scope.section = s;
		$scope.getData();
	};
	$scope.formatPeer = function(row) {
		var inc = 'outgoing' === row.getProperty('direction');
		var dir = inc
			? '<abbr title="Incoming"><i class="flaticon-arrow219"></i></abbr> '
			: '<abbr title="Outgoing"><i class="flaticon-arrow217"></i></abbr> ';
		var peer;
		if(inc) {
			peer = row.getProperty('caller');
		} else {
			var c = row.getProperty('called');
			var f = row.getProperty('calledfull');
			if(null === f || f.length === 0 || c === f)
				peer = c;
			else if(c.length + f.length <= 10)
				peer = c + ' (' + f + ')';
			else
				peer = '<abbr title="' + f + '">' + c + '</abbr>';
		}
		return dir + ' ' + peer;
	};
	$scope.gridOptions = {
		data: 'myData',
		columnDefs: [
//			{field:'id', displayName:'id'},
			{field:'ts', displayName:'Time', cellTemplate:'<div class="ngCellText"><abbr title="{{row.getProperty(\'ts\')}}">{{row.getProperty(\'ts\').substr(8,11)}}</abbr></div>' },
			{field:'billid', displayName:'Billid'},
			{displayName:'Peer', cellTemplate:'<div class="ngCellText" ng-bind-html="formatPeer(row) | unsafe"></div>'},
//			{field:'direction', displayName:'Direction'},
//			{field:'caller'}, {field:'called'},
//			{field:'duration', displayName:'Duration'},
			{field:'billtime', displayName:'Bill Time'},
			{field:'ringtime', displayName:'Ring Time'},
			{field:'status', displayName:'Status'},
			{field:'reason', displayName:'Reason'},
//			{field:'ended', displayName:'ended'},
//			{field:'callid', displayName:'callid'},

//			{field:'id', displayName:'Id', cellTemplate: '<a ng-href="#/pgroups/{{row.getProperty(\'id\')}}">{{row.getProperty(col.field)}}</a>'},
		],
		showFilter: true,
		multiSelect: false,
		selectedItems: $scope.selection,
		enablePaging: true,
		showFooter: true,
		totalServerItems: 'totalServerItems',
		pagingOptions: $scope.pagingOptions,
	};
	$scope.getData();
});

ctrlrModule.controller('MyPhoneCtrl', function($scope, $http) {
});

ctrlrModule.controller('MyAbbrsCtrl', function($scope, $http) {
});

ctrlrModule.controller('MyBLFsCtrl', function($scope, $translate, $http) {
	var urlBase = '/u/blfs/';
	$scope.selection = [ ];
	$http.get(urlBase + 'list').success(function(data) {
		$scope.myData = data.rows;
	});
	$scope.columnDefs = [
		{field:'key', displayName:'Key', width:'15%'},
		{field:'num', displayName:'Number', width:'15%'},
		{field:'label', displayName:'Label'},
	];
	$scope.columnDefs.forEach(function(colDef) {
		$translate(colDef.displayName).then(function(tr) {
			colDef.displayName = tr;
		});
	});

	$scope.gridOptions = {
		data: 'myData',
		columnDefs: 'columnDefs',
		multiSelect: false,
		selectedItems: $scope.selection,
	};
	$scope.onNew = function() {
		var newRow = { id: 'create', key:1, num:'', label:'', changed: true };
		if($scope.myData.length)
			newRow.key = parseFloat($scope.myData[$scope.myData.length - 1].key) + 1;
		$scope.myData.push(newRow);
		var index = $scope.myData.indexOf(newRow);
		var e = $scope.$on('ngGridEventData', function() {
			$scope.gridOptions.selectItem(index, true);
			var grid = $scope.gridOptions.ngGrid;
			grid.$viewport.scrollTop((grid.rowMap[index] + 1) * grid.config.rowHeight);
//			e();
		});
	};
	$scope.onSave = function() {
		var saveData = {
			action: 'save',
			key: $scope.selection[0].key,
			num: $scope.selection[0].num,
			label: $scope.selection[0].label,
		};
		$.each($scope.selection[0], function(key, value) { // XXX depends on jQuery
				if(key === 'id' || key === 'changed')
					return;
				saveData[key] = value;
		});
		$http({
			method: 'POST',
			url: urlBase + $scope.selection[0].id,
			data: $.param(saveData), // XXX depends on jQuery
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).success(function(data) {
			//alert(angular.toJson(data));
			if(data.obj) {
				for(k in data.obj) {
					$scope.selection[0][k] = data.obj[k];
				}
			}
			$scope.selection[0].changed = false;
		});
	};
	$scope.onDelete = function() {
		var delRow = function() {
			var index = $scope.myData.indexOf($scope.selection[0]);
			$scope.gridOptions.selectItem(index, false);
			$scope.myData.splice(index, 1);
		};
		if(isNaN(parseFloat($scope.selection[0].id)))
			delRow();
		else {
			$http({
				method: 'POST',
				url: urlBase + 'delete',
				data: 'id=' + $scope.selection[0].id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(delRow);
		}
	};
	$scope.dataSource = function (a) {
		var url = '/u/phonebook/search?' + $.param({ q: a, loc: 1, more: 1, pvt: 1, com: 1 }, true); // use jQuery to url-encode object
		return $http.get(url).then(function (response) {
			return response.data.result.map(function(a) { return {
				num: a.num,
				label: a.num + ' ' + a.descr,
			}});
		});
	};
});



