//*NOTE: All response from API Call will contain the following structure
/*


 {
 "status": "success",=====> will contain either 'success' or 'failure'
 "code": 200,======> status code Ex:404,500,200
 "data": {},====>>requested data
 "error": ""====>>if any errors
 }


 */

/*Service Factory for API Calls*/

angular.module('ProductService', ['ngResource']).factory('Product', function ($resource) {
    return $resource('/:entity/:id', {
        id: '@id'
    }, {
            fetch: {
                method: 'GET',
                params: {
                    entity: 'product'
                }
            }
        });
});


/*Create Angular Module*/

var Capstone = angular.module('Capstone', ['ProductService', 'ui.router']);

/*App Route Config to define states for navigation.using the state provider.*/

function CapstoneRouteConfig($stateProvider, $urlRouterProvider) {
    var app_dir = '../../pages';

    $urlRouterProvider.otherwise('/list');

    $stateProvider
        .state('/list', {
            url: '/list',
            templateUrl: app_dir + '/list.html',
            controller: productController
        })
        .state('/create', {
            url: '/create',
            templateUrl: app_dir + '/book.html',
            controller: 'addBookController'
        })
        .state('bookUpdate', {
            url: "/edit/:id",
            templateUrl: app_dir + '/book.html',
            controller: 'bookUpdateController'
        })
}
Capstone.config(CapstoneRouteConfig);


/*Book List Controller
 ==============================
To retrieve the list of books available and also 
delete the selected book based on id*/

//Controller to retrieve the list of books stored in database
function productController(Product, $scope, $http, $filter, $timeout, $location, $sce, $rootScope, Service) {
    $scope.catArray = [];
    $scope.removedMessage = false;

    $scope.service = Service;

    //scope variables
    $scope.categories = [];
    $scope.filterData = [];

    //Populates Products by calling rest api /products which
    //retrieves the list of books stored in database. 
    $scope.getProducts = function () {
        $http({
            method: 'GET',
            url: '/products'
        }).then(function successCallback(response) {
            $scope.Products = response.data.data;
            $scope.filterData = angular.copy($scope.Products);
            $scope.categories = [];
            $scope.Products.forEach(function (data) {
                if ($scope.categories.indexOf(data.category) == -1) {
                    $scope.categories.push(data.category)
                }
            })
        }, function errorCallback(response) {

        });
    };
    $scope.getProducts();

    $scope.AddBook = function () {
        $location.path('/create');
    }

    $scope.insertFn = function (id) {
        $scope.selectedTab = id;
        $scope.catArray = [];
        if ($scope.catArray.indexOf(id) == -1)
            $scope.catArray.push(id);
        $scope.Products = $scope.filterFunction($scope.filterData, $scope.catArray)
    };

    //Function to Filter the Products
    $scope.filterFunction = function (Products, categories) {
        return Products.filter(function (product) {
            if (categories.indexOf(product.category) != -1) {
                return true;
            }
            return false;
        });
    };

    $scope.resetFilter = function () {
        $scope.catArray = [];
        $scope.Products = $scope.filterData;
    }

    $scope.Prodid = '';
    $scope.storeId = function (id) {
        $scope.Prodid = id;
    },

        //Function to remove product based on id
        $scope.remove = function () {

            Service.removeProducts($scope.Prodid).then(function (response) {
                var promise = $scope.getProducts();

                if (response.status == 'success') {

                    $scope.removedMessage = true;
                    $timeout(function () {
                        $scope.removedMessage = false;
                    }, 2000);

                    promise.then(function (response) {
                        if (response.status == 'success') {
                            $scope.products = response.data;

                        }
                    });
                }
            });

        }
}



/*Book Create Controller * */

Capstone.controller('addBookController', function ($scope, $location, Service, $timeout) {
    var product = {
        category: '',
        description: '',
        name: '',
        price: ''
    }
    $scope.title = 'Add Book';
    $scope.back = function () {
        $location.path('/list')

    },
        $scope.successMsg = 'Successfully Saved!';
    $scope.submitForm = function (isValid) {
        if (isValid) {

            product.category = $scope.category;
            product.description = $scope.description;
            product.name = $scope.name;
            product.price = $scope.price;
            Service.addProduct(product).then(function (response) {

                if (response.status == 'success') {

                    $scope.updateMessage = true;
                    $timeout(function () {
                        $scope.updateMessage = false;
                        $location.path('/list');
                    }, 1000);
                }


            });
        }
    },
        $scope.cancel = function (createForm) {


            if (createForm.$dirty) {
                $scope.category = null, $scope.description = null, $scope.name = null, $scope.price = null;
                $scope.createForm.$setPristine();
                $scope.createForm.$setUntouched();

            }

        }

});

/*End of Book Create Controller*/

/*Book edit Controller* */
Capstone.controller('bookUpdateController', function ($scope, $location, Service, $timeout) {
    $scope.product = Service.productUpdate();
    $scope.category = $scope.product.category,
        $scope.description = $scope.product.description,
        $scope.name = $scope.product.name,
        $scope.price = $scope.product.price;

    $scope.title = 'Update Book';
    $scope.updateMessage = false;

    $scope.submitForm = function (isValid) {

        if (isValid) {
            var productEdit = {
                category: $scope.category,
                description: $scope.description,
                name: $scope.name,
                price: $scope.price
            }
            Service.editProduct($scope.product._id, productEdit).then(function (response) {

                if (response.status == 'success') {
                    $scope.successMsg = 'Successfully Updated!'
                    $scope.updateMessage = true;
                    $timeout(function () {
                        $scope.updateMessage = false;
                        $location.path('/list');
                    }, 2000);
                }
            });
        }
    },
        $scope.cancel = function (createForm) {

            $scope.category = null, $scope.description = null, $scope.name = null, $scope.price = null;
            $scope.createForm.$setPristine();
            $scope.createForm.$setUntouched();

        }

    $scope.back = function () {
        $location.path('/list');

    }


});
/*End of Book edit Controller*/

Capstone.service('Service', function ($http, $q) {

    var ProductDetail = '';

    this.removeProducts = function (id) {
        var deferred = $q.defer();
        $http.delete('/product/' + id).then(function (response) {

            deferred.resolve(response.data);
        });
        return deferred.promise
    },
        this.addProduct = function (Product) {
            var deferred = $q.defer();
            $http.post('/product', Product).then(function (response) {

                deferred.resolve(response.data);
            });
            return deferred.promise

        },
        this.editProduct = function (id, productEdit) {
            var deferred = $q.defer();
            $http.put('/product/' + id, productEdit).then(function (response) {

                deferred.resolve(response.data);
            });
            return deferred.promise

        },
        this.getProductId = function (prod) {
            ProductDetail = prod;

        },
        this.productUpdate = function () {
            return ProductDetail;
        }
});