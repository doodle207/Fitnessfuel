#Type casting =
from operator import truediv

# name  = "Arlecchino"
# age = 20
# gpa = 3.9
# is_student = True

# print(type(name))
# gpa = int(gpa)
# age  = str(age)           ### still 25  it's now a string as "25"
# print(type(age))          ### proof


# age += 1
# print(age)                ### will get type error u can't add str to int

# age += "1"
# print(age)                ### they behave differently


# name = input("Enter your name: ")
# name = bool(name)
# print(name)

# Input() = A function that prompts the user to enter data and returns the entered data as a string

# X = input("Are you an Otaku? (y/n): ")
# while X == "":
#     print("Give a ANS PLEASE!")
#     X = input("Are you an Otaku? (y/n): ").strip().lower()
# X = X.lower().strip()
# if X == "y".lower().strip():
#     print("Welcome Otaku-chan")
# elif X == "n".lower().strip():
#     print("Welcome Tsu-chan😑")
# else:
#     print("At least ans in yes or no😭")
#     X = input("Are you an Otaku? (y/n): ")
#     if X == "y".lower().strip():
#         print("Welcome Otaku-chan")
#     elif X == "n".lower().strip():
#         print("Welcome Tsu-chan😑")





# def ask_yes_no(prompt):
#     yes_words = {"yes", "y", "yeah", "sure", "ok", "affirmative"}
#     no_words = {"no", "n", "nope", "nah", "negative"}
#
#     while True:
#         reply = input(prompt + " (yes/no) : "  ).lower().strip()
#         if reply in yes_words:
#             return True
#         elif reply in no_words:
#             return False
#         else:
#             print("please enter yes or no")
# if ask_yes_no("Are you Otaku?"):
#     print("GET A LIFE!! ")
# else:
#     print("welcome sir! ")



### LOGICAL OPERATORS = evaluate multiple conditions (or, and, not)
#                       or = at least oen conditions must be true
#                       and = both conditions must be true
#                       not = inverts the condition (not false, not true)

# temp = 20
# is_raining = False
#
# if temp > 35 or temp < 0 or is_raining:
#     print("The date is cancelled 😭...")
# else:
#     print("THE DATE IS STILL SCHEDULED MY LADY💕~")



# temp = 20
# is_sunny = False
#
# if temp >= 28 and is_sunny:
#     print("It is HOT outside")
#     print("It is sunny")
# elif temp <=0 and is_sunny:
#     print("It is COLD outside")
#     print("It is sunny")
# elif 28 > temp > 0 and is_sunny:
#     print("It is WARM outside")
#     print("It is sunny")
#
# elif temp >=28 and not is_sunny:
#     print("It is HOT outside")
#     print("It is CLOUDY")
# elif temp <=0 and not is_sunny:
#     print("It is COLD outside")
#     print("It is CLOUDY")
# elif 28 > temp > 0 and not is_sunny:
#     print("It is WARM outside")
#     print("It is CLOUDY")



### CONDITIONAL EXPRESSION = A one-line shortcut for the if-else statement (ternary operator)

# num = -2
# a = 6
# b = 7
# age = 18
# temp = 30
# user_role = "admin"

# print("Positive" if num > 0 else "Negative")
# result = "even" if num % 2 == 0 else "odd"
# max_num = a if a > b else b
# status = "Adult" if age >= 18 else "child"
# weather = "Hot" if temp > 20 else "Cold"
# access_level = "full access" if user_role == "admin" else "limited access"
#
# print(access_level)



# name = input("Enter your name: ")
# character_to_search = input("Enter your character: ")
# result = name.lower().find(character_to_search.lower())
# print(result)


# name = "Arlecchino"
# result = len(name)
# result = name.rfind("c")
# result = name.capitalize()
# result = name.upper()
# result = name.lower()
# result = name.isdigit()
# result = name.isalpha()
# result = name.count("c")
# result = name.replace("o", "o~")
# print(result)


# print(help(str))          ###  just a bunch of other methods




### Indexing = accessing elements of a sequence using [] (indexing operator)
#               [start : end : step]
#
# card_num = "1234-5678-9012-3456"
#
# print(card_num[0])
# print(card_num[:4])
# print(card_num[5:9])
# print(card_num[5:])
# print(card_num[-1])
#
# print(card_num[::3])
# last_digits = card_num[-4:]
# print(f"XXXX-XXXX-XXXX-{last_digits}")
#
# card_num = card_num[::-1]
# print(card_num)


### Format specifiers = {value:flags} format a value based on what flag are inserted

# .(number)f == round to that many decimal places (fixed point)
# :(number) == allocate that many spaces
# :03 == allocate and zero pad that many spaces
# :< == left justify
# :> == right justify
# :^ == center align
# :+ == use a plus sigh to leftmost position
# := == place sign to leftmost position
# :  == insert a space before positive number
# :, == comma separator
#
# these can be used multiple times in a single function
#


# price1 = 3.14159
# price2 = -987.65
# price3 = 12.34
#
# print(f"price 1 is {price1:.2f}")
# print(f"price 2 is {price2}")
# print(f"price 3 is {price3}")



####  while loop = execute some code while some condition remains true

# name = input("Enter your name: ")
#
# while name == "":
#     print("you did not enter your name: ")
#     name = input("Enter your name: ")    ### remove this and the u are stuck
#
# print(f"hello {name}")


# enter = input("Enter: ")
# while enter == "":
#     print("Arlecchino my love~")
#
#  hehe this is nice

# num = int(input("Enter a # between 1 - 10: "))
#
# while num  < 1 or num > 10:
#     print(f"{num} is not between 1 and 10")
#     num = int(input("Enter a # between 1 - 10: "))
#
# print(f"your number is {num}")


#### oython compound interest calculator
# principle = 0
# rate = 0
# time = 0
# while principle <= 0:
#     principle = float(input("Enter the principle amount:  "))
#     if principle <= 0:
#         print("principle can't be less than or equal to zero")
#
# while rate <= 0:
#     rate = float(input("Enter the rate amount:  "))
#     if rate <= 0:
#          print("Interest rate can't be less than or equal to zero")
#
# while time <= 0:
#     time = float(input("Enter the time amount:  "))
#     if time <= 0:
#         print("time can't be less than or equal to zero")
#
#
# total = principle * pow((1 + rate/ 100), time)
# print(f"your balance after {time} year/s is: ${total:.2f}")

### another way to do it and also allow ZERO value






# principle = 0
# rate = 0
# time = 0
# while True:
#     principle = float(input("Enter the principle amount:  "))
#     if principle < 0:
#         print("principle can't be less than or equal to zero")
#     else:
#         break
#
# while True:
#     rate = float(input("Enter the rate amount:  "))
#     if rate < 0:
#          print("Interest rate can't be less than or equal to zero")
#     else:
#         break
# while True:
#     time = float(input("Enter the time amount:  "))
#     if time < 0:
#         print("time can't be less than or equal to zero")
#     else:
#         break
#
# total = principle * pow((1 + rate/ 100), time)
# print(f"your balance after {time} year/s is: ${total:.2f}")
#



### for loop = execute a block of code a fixed number of times.
#              you can iterate over a range, string, sequence, etc.

# for counter in reversed(range(1,11)):
#     print(counter)
#
# print("HAPPY NEW YEAR!")





# for x in range(1,11):
#     if x == 7:
#         continue
#     else:
#         print(x)


# for x in range(1,11):
#     if x == 7:
#         break
#     else:
#         print(x)



# import time



# my_time = int(input("Enter the time in seconds: "))
#
# for x in reversed(range(0, my_time)):      # OR     for x in range(my_time, 0 , -1)
#     print(x)
#     time.sleep(1)
#
# print("times up")


# my_time = int(input("Enter the time in seconds: "))
# for x in range(my_time, 0 , -1):
#     print(x)
#     time.sleep(1)
#
# print("times up!")

### lets make a clock

# my_time = int(input("Enter the time in seconds: "))
#
# for x in range(my_time, 0 , -1):
#     seconds = x % 60
#     minutes = int(x / 60) % 60
#     hours = int(x / 3600)
#     print(f"{hours:02}:{minutes:02}:{seconds:02}")
#     time.sleep(1)
#
# print("times up!")



### nested loop = A loop within another loop  (outer, inner)
#                 outer loop:
#                     inner loop:


# for x in range(3):
#     for y in range(1, 10):
#         print(y, end="")
#     print()

# rows = int(input("Enter the # of rows: "))
# columns = int(input("Enter the # of columns: "))
# symbol = input("Enter the symbol: ")
#
# for x in range(rows):
#     for y in range(columns):
#         print(symbol, end="")
#     print()



### collection = single "variable" used to store multiple values
#   list = [] ordered and changeable. Duplicates OK
#   set = {} unordered and immutable, but Add/Remove OK. NO duplicates
#   Tuple = () ordered and unchangeable. Duplicates OK. FASTER

# fruits = ["Apple", "Orange", "Banana", "Coconut",]
# print(dir(fruits))
# print(help(fruits))
# print(len(fruits))
# print("Apple" in fruits)
# print(fruit[::-1])
# for fruit in fruits:
#      print(fruit)



# fruits[0] = "pineapple"      ##  basically replace
# for fruit in fruits:
#     print(fruit)
# fruits.append("pineapple")
# fruits.remove("Apple")
# fruits.insert(0, "pineapple")
# fruits.sort()
# fruits.reverse()
# fruits.clear()
# print(fruits.index("Apple"))
# print(fruits.count("Apple"))


# print(fruits)

### set

# fruits = {"Apple", "Orange", "Banana", "Coconut",}
#print(dir(fruits))
#print(help(fruits))


# print(fruits)


### let's find out the sum of even numbers in 1 to 100

# Sum = 0
# for x in range(1,101):
#     if x%2 == 0:
#         Sum += x
#
# print(Sum)


# how about first 50 number and their squared values
#
# for x in range(1,51):
#     print(x,"^2 =", x**2)

### for first 10 even or odd numbers

# numbers = [3, 8, 15, 22, 7, 14, 29, 30, 41, 50, 62, 71, 88, 93, 100, 120,130,140,145,155,169]
#
# # First 10 even numbers from the sample
# first_10_even = [n for n in numbers if n%2 == 0][:10]
# print(f"First 10 evens:",first_10_even)
#
# # First 10 odd numbers from the sample
# first_10_odd = [n for n in numbers if n % 2 != 0][:10]
# print("First 10 odds:", first_10_odd)
#
### want the sum of them?? just print("Sum of even or odd", sum(first_10_even or odd)



# first_100_even = [2 * n for n in range(1,101)]
# print(first_100_even)

#
# first_100_odd = [2* n + 1 for n in range(100)]
# print(first_100_odd)





### Let's make a billing project

# while True:
#     name = input("Enter the GOONER's name: ")
#     total = 0
#     while True:
#         print("Enter the Amount and Quantity:")
#         Amount = float(input("Enter the Amount: "))
#         Quantity = int(input("Enter the Quantity: "))
#         total += Amount * Quantity
#         repeat = input("Would you like to Add more items? (y/n)? ").lower().strip()
#         if repeat == "no" or repeat == "n":
#             break
#
#     print("-"*50)
#     print("Name:", name)
#     print("Total: $", total)
#     print("-"*50)
#     print("********** Thanks for coming to GoonShop **********")
#
#     repeat1 = input("Would you like to go to next GOONER? (y/n)? ").lower().strip()
#     if repeat1 == "no" or repeat1 == "n":
#         break

#
# rows = int(input("Enter the # of rows: "))
# columns = int(input("Enter the # of columns: "))
# symbol = input("Enter the symbol: ")
#
# for x in range(rows):
#     for y in range(x+1):
#         print(symbol, end = " ")
#     print()


# rows = int(input("Enter the # of rows: "))
# columns = int(input("Enter the # of columns: "))
#
# for x in range(rows+1):
#     for y in range(1,x+1):
#         print(x, end = " ")
#     print()



# rows = int(input("Enter the # of rows: "))
# columns = int(input("Enter the # of columns: "))
# # symbol = input("Enter the symbol: ")
# for x in range(1,rows+1):   ### or (1,6)
#     for y in range(6,x,-1):
#         print(x,end=" ")
#     print()
#



# for x in range(1,6):
#     for y in range(6,x,-1):
#         print(x, end=" ")
#     print()

# for x in range(1,11):
#     for y in range(10,x,-1):
#         print(" ",end=" ")
#     for z in range(x):
#         print("*",end=" ")
#     print()



# for i in range(1, 11):
#     stars = "* " * i
#     print(f"{stars: >20}")
#

# for x in range(1,6):
#     for y in range(x, 0 , -1):
#         print(y, end=" ")
#     print()
#


# for x in range(1,6):
#     for y in range(1, x+1):
#         print("*", end=" ")
#     print()
# for i in range(5, 0 , -1):
#     for j in range(0, i-1):
#         print("*", end=" ")
#     print()




# for x in range(1,11):
#     for y in range(1, x+1):
#         print(x*y, end=" ")
#     print()




















































































































































































































































