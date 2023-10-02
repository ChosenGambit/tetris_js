/**
* Tetris
* @Author: ChosenGambit
*/
document.addEventListener("DOMContentLoaded", function() {
   
   var canvas = document.getElementById('canvas');
   var next = document.getElementById('stats');
   var canvas_ctx = canvas.getContext('2d');
   var stats_ctx = next.getContext('2d');
   var canvas_width = canvas.offsetWidth;   
   var canvas_heigth = canvas.offsetHeight;
   var stats_width = next.offsetWidth; 
   var stats_heigth = next.offsetHeight;   
   var cw = 20; // cell width
   var grid_offset = 5; // compensate for line thickness of canvas border
   var grid = []; // create a grid for easy reference
   var grid_width = 10;
   var grid_height = 20;
   var game_over_line = 5;
   var block;
   var next_block;
   var next_block_color;
   var block_color;
   var block_position_x = 5; // define grid x offset for block to spawn
   var block_position_y = 1; // define grid x offset for block to spawn
   var rotation = 0;
   var speed = 500; // the lower the faster
   var max_speed = 100;
   var speedup_per_line = 4;
   var move_down = speed;
   var thread_refresh = 50; 
   var gradient; // current paint gradient
   var game_over;
   var score;
   var removed_lines;   
   var num_blocks = 0;
   
   init();
   
   // init game
   function init() {
       
       score = 0;
       num_blocks = 0;
       removed_lines = 0;
       game_over = false;
       createGrid(grid_height,grid_width);      
       // create 2 blocks, one current and the next
       next_block = createBlock(); 
       next_block = createBlock();
       
       // create paint "thread"
       if (typeof loop != 'undefined') {
           clearInterval(loop);
       }
       loop = setInterval(paint, thread_refresh);   

   }
   
   /**
    * paint graphics on canvas
    * @returns {undefined}
    */
   function paint() {  
       
       // clear all
       //canvas_ctx.clearRect(0,0,canvas_width,canvas_heigth);
       // paint canvas
       canvas_ctx.fillStyle = 'white';
       canvas_ctx.fillRect(0,0,canvas_width,canvas_heigth);
      // paint part of the screen where player is game over
       canvas_ctx.fillStyle = "#ffe5f0";
       canvas_ctx.fillRect(grid_offset,grid_offset,canvas_width-grid_offset, game_over_line*cw);
       // canvas border
       canvas_ctx.strokeStyle = '#009933';
       canvas_ctx.lineWidth = 10;
       canvas_ctx.strokeRect(0,0,canvas_width,canvas_heigth);
       // extra line as canvas border
       canvas_ctx.strokeStyle = '#333333';
       canvas_ctx.lineWidth = 1;
       canvas_ctx.strokeRect(0,0,canvas_width,canvas_heigth);
       
       // paint stats
       stats_ctx.fillStyle = "white";
       stats_ctx.fillRect(0,0,stats_width,stats_heigth);
       //score
       stats_ctx.fillStyle = "black";
       stats_ctx.font = "20px Arial";
       stats_ctx.fillText("Score: "+score,10,140);
       // lines
       stats_ctx.fillText("Lines: "+removed_lines,10,170);
       
       // draw next block
       for (var square in next_block[0]) {     
           var x = next_block[0][square].x;
           var y = next_block[0][square].y;
           setBlockPaint( (2*cw) + (x * cw), (2*cw) + (y * cw), next_block_color, stats_ctx);
           stats_ctx.fillRect( (2*cw) + (x * cw), (2*cw) + (y * cw), cw, cw);
           stats_ctx.strokeRect( (2*cw) + (x * cw), (2*cw) + (y * cw), cw, cw);
       }
       
       // make block go down
       moveDown(thread_refresh);

       // paint current block
       if (typeof block != 'undefined') {
           // place block in upper middle of canvas
           for (var square in block[rotation]) {                 
               var x = block[rotation][square].x;
               var y = block[rotation][square].y               
               setBlockPaint( ((block_position_x * cw) + grid_offset + (x * cw)), ((block_position_y * cw) + grid_offset + (y * cw)), block_color, canvas_ctx);
               canvas_ctx.fillRect((block_position_x * cw) + grid_offset + (x * cw), (block_position_y * cw) + grid_offset + (y * cw), cw, cw);
               canvas_ctx.strokeRect((block_position_x * cw) + grid_offset + (x * cw), (block_position_y * cw) + grid_offset + (y * cw), cw, cw);
            }
       }       
       
       // paint rest of the grid
       for (y = 0; y < grid_height; y++) {
           for (x = 0; x < grid_width; x++) {   
               if (grid[y][x] != false) {                   
                   setBlockPaint((x * cw) + grid_offset, (y * cw) + grid_offset, grid[y][x], canvas_ctx);
                   canvas_ctx.fillRect((x * cw) + grid_offset, (y * cw) + grid_offset, cw, cw);
                   canvas_ctx.strokeRect((x * cw) + grid_offset, (y * cw) + grid_offset, cw, cw);
               }
           }
       }
   }
   
   /**
    * move block down
    * @param {type} thread_refresh
    * @returns {undefined}
    */
   function moveDown(thread_refresh) {  
       move_down -= thread_refresh;       
       
       if (move_down <= 0) {       
                  
           move_down = speed;
           
            // check whether block is still in grid or touches another block in the next y position
            if (!inGrid(rotation, block_position_y+1, block_position_x)) {
                placeBlock(); // place in current state
            } 
            // check whether next position of block hits something
            else if (hitTest(rotation, block_position_y+1, block_position_x)) {
                placeBlock(); // place in current state
            }   
            
            block_position_y++;
       }
   }
   
   /**
    * place block on grid
    * @returns {undefined}
    */
   function placeBlock() {    
              
       num_blocks++;
       for (var square in block[rotation]) {  
           // x and y are grid positions
           var x = block_position_x + block[rotation][square].x;
           var y = block_position_y + block[rotation][square].y;
           grid[y][x] = block_color;
       }      
       
       checkCompletedLines(); 
       createBlock();      
       checkGameOver();       
   }
   
   /**
    * game over if:
    * - new block hits current building of blocks
    * - last placed block hits red area
    * @returns {undefined}
    */
   function checkGameOver() {
        // check if block is in red area        
        for (y = 0; y < game_over_line; y++) {
            for (x = 0; x < grid_width; x++) {  
                if (grid[y][x] != false) {                    
                    game_over = true;
                    console.log("Game Over: your stack is hitting the red area");
                }
            }               
        }
       
        for (y = 0; y < grid_height; y++) {
            var logString = "";
             for (x = 0; x < grid_width; x++) {
                 logString += "["+y+"]["+x+"]: "+grid[y][x] + ", ";
            }
        }
        
       // stop loop
       if (game_over) clearInterval(loop);           
       
   }
   
   /**
    * check if line is complete
    * @returns {undefined}
    */
   function checkCompletedLines() {
       
       if (game_over) return;
       
       var lines = [];
       for (var y = 0; y < grid_height; y++) {
           var complete = true;
           for (var x = 0; x < grid_width; x++) {
               if (grid[y][x] == false) complete = false;
           }           
           // remove line if complete is still true
           if (complete) lines.push(y);
       }
       // update score       
       for (var s=0;s<lines.length;s++) {
           removed_lines++;      
           score += (100*(s+1));  
           speed -= speedup_per_line;
           if (speed < max_speed) speed = max_speed;
       }

       // remove completed lines
       if (lines.length > 0) {
           removeCompletedLines(lines);
           moveRestDown(lines);
       }
       
   }
   
   /**
    * removes lines that are complete
    * @param {array} lines
    * @returns {undefined}
    */
   function removeCompletedLines(lines) {
       // remove lines
       for (var line = 0; line < lines.length; line++) {
           for (var x = 0; x < grid_width; x++) {
               grid[lines[line]][x] = false; // remove line               
           }
       }
   }
   
  /**
  * Move each line one down if possible
  */  
  function moveRestDown(lines) {
       
        // do this for the height of the map (bit hacky)
        for (n = 0; n < grid_height; n++) {
            // move upwards from the bottom of the grid
            for (var y = grid_height-1; y > 0; y--) {
                if (isEmptyLine(y)) {
                    // copy line above to below
                    if (y-1 > 0) {      
                        // cannot do it ByRef! e.g.: grid[y] = grid[y-1];
                        copyLine(y-1, y);
                        removeCompletedLines([y-1]);                                                
                    }
                }          
            }
        }
   }
   
   /**
   * copy a line (from_y) to another line (to_y)
   */
   function copyLine(from_y, to_y) {
       for (var x = 0; x < grid_width; x++) {
           grid[to_y][x] = grid[from_y][x]
       }
   }
   
   /**
   * Return true if this line is empty
   */
   function isEmptyLine(line_y) {
        for (var x = 0; x < grid_width; x++) {
            if (grid[line_y][x] != false) return false;
        }           
        return true;
   }
            
    /**
     * create grid
     * a false grid position means unfilled or 'free'
     * @returns {undefined}
     */
   function createGrid(ySize, xSize) {
       for (y = 0; y < ySize; y++) {
           grid[y] = [];
           for (x = 0; x < xSize; x++) {                
               grid[y][x] = false; 
           }
       }
   }
   
   /**
    * check if the entire block is inside the grid
    * check if the block touches another block that is already placed
    * @param {type} y
    * @param {type} x
    * @returns true if untouched (free to move or rotate)
    */
   function inGrid(rotation, block_position_y, block_position_x) {
       for (var square in block[rotation]) {  
           // check if in grid for each of the 4 squares in the block
           var x = block_position_x + block[rotation][square].x;
           var y = block_position_y + block[rotation][square].y;
           // calculate if current position of all squares of the block are inside the grid
           if (x >= 0 && x < grid_width && y >= 0 && y < grid_height) {
               // skip
           }
           else return false;
       }
       return true;
   }
   
  /**
   * check if block hits something
   * @param {type} rotation
   * @param {type} block_position_y
   * @param {type} block_position_x
   * @returns true if touches another square
   */
   function hitTest(rotation, block_position_y, block_position_x) {
       for (var square in block[rotation]) { 
           // check if in grid for each of the 4 squares in the block
           var x = block_position_x + block[rotation][square].x;
           var y = block_position_y + block[rotation][square].y;                      
           // check if touches another block
           if (grid[y][x] == false) {
               // skip
           }
           else return true;
       }
       return false;
   }
   
   /**
    * create block
    * @returns {undefined}
    */
   function createBlock() {
       
       if (game_over) return;
       
       rotation = 0;
       block_position_x = 5; // start position of block in the grid
       block_position_y = 1;
              
       block = next_block;
       block_color = next_block_color;
       next_block = [];      
       
       var r = Math.round(Math.random()*700);
       // create square
       if (r>=0 && r<100) {    
           // line
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:0, y:1}, t3:{x:0, y:2} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:1, y:0}, t3:{x:2, y:0} } );
           next_block_color = 'green';           
       }
       else if (r>=100 && r<200) {
           // square
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:1}, t2:{x:1, y:0}, t3:{x:1, y:1} } );
           next_block_color = 'pink';           
       } 
       else if (r>=200 && r<300) {
           // S           
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:1}, t2:{x:-1, y:0}, t3:{x:-1, y:-1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:0, y:-1}, t3:{x:1, y:-1} } );
           next_block_color = 'cyan';    
       }
       else if (r>=300 && r<400) {
           // S flipped
           next_block.push( { t0:{x:0, y:0}, t1:{x:1, y:0}, t2:{x:0, y:1}, t3:{x:1, y:-1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:1, y:0}, t3:{x:-1, y:-1} } );
           next_block_color = 'blue';   
       }
       else if (r>=400 && r<500) {
           // T
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:0, y:-1}, t3:{x:1, y:0} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:1, y:0}, t3:{x:0, y:1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:0, y:1}, t3:{x:1, y:0} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:-1, y:0}, t3:{x:0, y:1} } );
           next_block_color = 'yellow';
       }
       else if (r>=500 && r<600) {
           // L
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:0, y:1}, t3:{x:1, y:1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:1, y:0}, t2:{x:-1, y:0}, t3:{x:-1, y:1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:1}, t2:{x:0, y:-1}, t3:{x:-1, y:-1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:1, y:0}, t3:{x:1, y:-1} } );
           next_block_color = 'red';
       }
       else {
           // L flipped
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:-1}, t2:{x:0, y:1}, t3:{x:-1, y:1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:1, y:0}, t2:{x:-1, y:0}, t3:{x:-1, y:-1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:0, y:1}, t2:{x:0, y:-1}, t3:{x:1, y:-1} } );
           next_block.push( { t0:{x:0, y:0}, t1:{x:-1, y:0}, t2:{x:1, y:0}, t3:{x:1, y:1} } );
           next_block_color = 'orange';
       }
       
       return next_block;
   }
   
    /**
    * set paint type for block
    * @param {type} block_type
    * @returns {undefined}
    */
   function setBlockPaint(start_x, start_y, block_color, canvas) {
       gradient = canvas.createLinearGradient(start_x,start_y,start_x+cw,start_y+cw);
       
       switch(block_color) {
           case 'green':
                gradient.addColorStop(0,"#00aa44");
                gradient.addColorStop(1,"#005533");                
           break;
           case 'blue':
                gradient.addColorStop(0,"#4f57fc");
                gradient.addColorStop(1,"#0f2a9c");                
           break;
           case 'cyan':
                gradient.addColorStop(0,"#68e0e8");
                gradient.addColorStop(1,"#0e8188");                
           break;
           case 'yellow':
                gradient.addColorStop(0,"#ebf064");
                gradient.addColorStop(1,"#8b8f17");                
           break;
           case 'red':
                gradient.addColorStop(0,"#fc4f4f");
                gradient.addColorStop(1,"#891313");                
           break;
           case 'pink':
                gradient.addColorStop(0,"#f05ed6");
                gradient.addColorStop(1,"#901c7c");                
           break;
           case 'orange':
                gradient.addColorStop(0,"#f5c759");
                gradient.addColorStop(1,"#997725");                
           break;
       }        
       canvas.fillStyle = gradient;
       canvas.strokeStyle = "#333333";
       canvas.lineWidth = 2; 
   }
   
   /**
    * rotate block to the left
    * @returns {undefined}
    * 
    */
   function rotateLeft() {
       // check if rotation would be inside the grid and does not touch something else
       var future_rotation = (rotation-1);
       if (future_rotation < 0) future_rotation = block.length-1;
       if (inGrid(future_rotation, block_position_y, block_position_x) && !hitTest(future_rotation, block_position_y, block_position_x)) {
           rotation = future_rotation;
       }
   }
   
   /**
    * rotate block to the right
    * @returns {undefined}
    * 
    */
   function rotateRight() {
       // check if rotation would be inside the grid and does not touch something else
       var future_rotation = (rotation+1);
       if (future_rotation > block.length-1) future_rotation = 0;
       if (inGrid(future_rotation, block_position_y, block_position_x) && !hitTest(future_rotation, block_position_y, block_position_x)) {
           rotation = future_rotation;
       }
   }
   
   /**
    * move block to direction
    * @param {type} x
    * @returns {undefined}
    */
   function move(x) {
       if (inGrid(rotation, block_position_y, block_position_x + x) && !hitTest(rotation, block_position_y, block_position_x + x)) {
           block_position_x += x;
       }
   }
   
   /**
    * move quicker down
    * @returns {undefined}
    */
   function moveDownQuick() {
        moveDown(thread_refresh*5);
   }
   
   /**
    * keys
    */
    document.addEventListener('keydown', function(e) {
        var key = e.which;
        //We will add another clause to prevent reverse gear
        if(key == "37") move(-1);
        else if(key == "38") rotateRight();
        else if(key == "39") move(1);
        if(key == "40") moveDownQuick();
    });

});
