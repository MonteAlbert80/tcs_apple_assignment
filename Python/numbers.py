# Monte Albert's assignment for TCS-Apple DevOps Lead role
# This file contains second question for the assignment

# Opening file in write mode
file1 = open('numbers.txt', 'w')

# Writing multiple lines of numbers
for x in range(1, 101):
    file1.writelines([str(x)+"\n"])
 
# Closing file
file1.close()
