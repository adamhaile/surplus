define('Surplus.animationFrame', ['Surplus'], function (Surplus) {
    Surplus.animationFrame = function animationFrame(go) {
        var scheduled = false,
            args = null;
    
        return tick;
    
        function tick() {
            args = Array.prototype.slice.apply(arguments);
            if (!scheduled) {
                scheduled = true;
                requestAnimationFrame(run);
            }
        }
        
        function run() {
            scheduled = false;
            go.apply(null, args);
        }
    }
});