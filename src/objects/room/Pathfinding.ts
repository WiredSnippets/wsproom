import { Avatar, FloorFurniture, FurnitureData, Room } from "../../";
import { FurnitureInfo } from "../../interfaces/IFurnitureData";
import { RoomPosition } from "../../types/RoomPosition";
import { TileType } from "../../types/TileType";

import * as EasyStar from "easystarjs";

export class Pathfinding {

    public grid: number[][] = [];
    public baseGrid: number[][];
    public door?: RoomPosition;

    private room: Room;
    private furnitureData: FurnitureData;
    private furniGrid: {
        roomObject: FloorFurniture;
        info: FurnitureInfo;
    }[][][] = [];

    constructor(room: Room, tilemap: TileType[][], furnitureData: FurnitureData) {
        this.room = room;
        this.furnitureData = furnitureData;

        this.baseGrid = tilemap.map((row) =>
            row.map((type) => (type !== "x" ? Number(type) : -1))
        );

        this.calculateFurnisFilledSpace();
        this.locateDoor();
    }

    private locateDoor () : void {
      this.baseGrid.forEach((row, i) => {
        if (row[3] === 0) {
          this.door = {
            roomX: 3, 
            roomY: i, 
            roomZ: 0
          };
        }
      });
    }

    public calculateFurnisFilledSpace () : Promise<void> {
        let grid = this.clone(this.baseGrid);
        let furniGrid = this.resetFurniGrid();
  
        const sub = async (roomObject : any) =>  {
          if (roomObject instanceof Avatar) {
            return;
          }
  
          // ignore wall placements
          if (roomObject.placementType === 'wall') {
            return;
          }
  
          const info = await this.furnitureData.getInfoForFurniture(roomObject);
  
          // !info.canlayon && !info.cansiton && 
          if (info && !info.canstandon) {
            this.calculateFilledSpace(roomObject, info, grid, furniGrid);
          }
        };
  
        // update navmesh at the end, so meanwhile the existing one can be used/its never empty
        return Promise.all(Array.from(this.room.roomObjects.values()).map(sub)).then(() => {
          this.grid = grid;
          this.furniGrid = furniGrid;
        });
      }
  
      private calculateFilledSpace (roomObject: FloorFurniture, info: FurnitureInfo, grid: number[][], 
        furniGrid: {
          roomObject: FloorFurniture, 
          info: FurnitureInfo
        }[][][]) : void {
        let dimensions = {
          x: 0,
          y: 0,
        };
        switch (info.defaultdir) {
          case 0: // up
          case 4: // down
            dimensions.x = info.xdim as number;
            dimensions.y = info.ydim as number;
            break;
          default:
            dimensions.x = info.ydim as number;
            dimensions.y = info.xdim as number;
            break;
        }
  
        switch (roomObject.direction) {
          case 0: // up
          case 4: // down
            for (let y = 0; y < dimensions.y; y++) {
              for (let x = 0; x < dimensions.x; x++) {
                this.addToGrid(roomObject.roomX + x, roomObject.roomY + y, roomObject, info, grid, furniGrid);
              }
            }
            break;
          default:
            for (let y = 0; y < dimensions.x; y++) {
              for (let x = 0; x < dimensions.y; x++) {
                this.addToGrid(roomObject.roomX + x, roomObject.roomY + y, roomObject, info, grid, furniGrid);
              }
            }
            break;
        }
      }
  
      private resetFurniGrid () : {
        roomObject: FloorFurniture, 
        info: FurnitureInfo
      }[][][] {
        let furniGrid : any = [];
        this.baseGrid.forEach((entries, y) => {
          furniGrid[y] = [];
  
          entries.forEach((useless, x) => {
            furniGrid[y][x] = [];
          });
        });
  
        return furniGrid;
      }
  
      private addToGrid (
        x: number, 
        y: number, 
        roomObject: FloorFurniture, 
        info: FurnitureInfo, 
        grid: number[][], 
        furniGrid: {
          roomObject: FloorFurniture, 
          info: FurnitureInfo
        }[][][]) : void {
        grid[y][x] = this.determineNegativeMesh(info);
  
        furniGrid[y][x].push({
          roomObject,
          info
        });
      }
  
      private determineNegativeMesh (info: FurnitureInfo) : number {
        if (info.canlayon) {
          return -2;
        }
        if (info.cansiton) {
          return -3;
        }
        if (info.canstandon) {
          return -4;
        }
        return -1;
      }

    getFurnisOnTile (position: RoomPosition) : {
      roomObject: FloorFurniture, 
      info: FurnitureInfo
    }[] {
        return this.furniGrid[position.roomY][position.roomX];
    }

    public findPath(origin: RoomPosition, target: RoomPosition) : Promise<
    {
      roomX: number;
      roomY: number;
      roomZ: number;
      direction: number | undefined;
    }[]
  > {
        return new Promise<
          {
            roomX: number;
            roomY: number;
            roomZ: number;
            direction: number | undefined;
          }[]
        >((resolve) => {
          const easystar = new EasyStar.js();
  
          let grid = this.grid;
  
          // if the target position is a sofa or a bed
          // set it as navigable so a path can be traced
          if (this.grid[target.roomY][target.roomX] < -1) {
            grid = this.clone(this.grid);
            grid[target.roomY][target.roomX] = 0;
          }
    
          easystar.setGrid(grid);
          easystar.setAcceptableTiles([1, 0]);
          //easystar.enableDiagonals();
    
          easystar.findPath(
            origin.roomX,
            origin.roomY,
            target.roomX,
            target.roomY,
            (result: {
                x: number;
                y: number;
            }[]) => {
              let currentPosition = {
                x: origin.roomX,
                y: origin.roomY,
              };
    
              const path: {
                roomX: number;
                roomY: number;
                roomZ: number;
                direction: number | undefined;
              }[] = [];
  
              if (!result) {
                resolve(path);
                return;
              }
              result.forEach((position, index) => {
                if (index === 0) return;
    
                const direction = this.getAvatarDirectionFromDiff(
                  position.x - currentPosition.x,
                  position.y - currentPosition.y
                );
    
                const tile = this.room.getTileAtPosition(position.x, position.y);
    
                if (tile != null) {
                  const getHeight = () => {
                    if (tile.type === "tile") return tile.z;
                    if (tile.type === "stairs") return tile.z + 0.5;
    
                    return 0;
                  };
    
                  path.push({
                    roomX: position.x,
                    roomY: position.y,
                    roomZ: getHeight(),
                    direction,
                  });
    
                  currentPosition = {
                    x: position.x,
                    y: position.y,
                  };
                }
              });
    
              resolve(path);
            }
          );
    
          easystar.calculate();
        });
    }

    private clone (grid : any) : any {
        return JSON.parse(JSON.stringify(grid));
    }

    private getAvatarDirectionFromDiff(diffX: number, diffY: number) : number {
        const signX = Math.sign(diffX) as -1 | 0 | 1;
        const signY = Math.sign(diffY) as -1 | 0 | 1;
      
        switch (signX) {
          case -1:
            switch (signY) {
              case -1:
                return 7;
              case 0:
                return 6;
              case 1:
                return 5;
            }
            break;
      
          case 0:
            switch (signY) {
              case -1:
                return 0;
              case 1:
                return 4;
            }
            break;
      
          case 1:
            switch (signY) {
              case -1:
                return 1;
              case 0:
                return 2;
              case 1:
                return 3;
            }
            break;
        }

        throw "Invalid direction set " + [diffX, diffY].join(",");
    }
}