# directories
DIRS="ts-core,control-plane,docs"

# for each directory, run git log and output to csv
for dir in $(echo $DIRS | sed "s/,/ /g")
do
  git log --pretty=format:"%h, %ad, %s" --date=format:%Y-%m-%d -- ../$dir > logs/$dir.csv
  tsx src/build.ts logs/$dir.csv > ../$dir/CHANGELOG.md
done
