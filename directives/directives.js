app.directive('disallowSpaces', function () {
  return {
    restrict: 'A',

    link: function ($scope, $element) {
      $element.bind('input', function () {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
      });
    }
  };
});