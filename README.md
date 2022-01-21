# SAC-Tools
## Superalgos Contributor Tools

  Since the Superalgos project, at the moment, does not have some built-in tools for calculating the volume of contributions and some statistics on the documents, some useful tools are implemented separately in this repository. At the moment this tool is aimed at the translation team and for those who work with documents. The functionality will be expanded as needed. 

**Implemented features:**
-----------------------
- Word count in documents, books and tutorials
- Finding obsolete translations in the documentation pages for each language
- Finding pages with incomplete content or definition
- Search for pages with incomplete translation in the selected language

**Installation:**
-----------------
Place the application in the folder next to the Superalgos folder and install the modules with the 'npm install' command.

![image](https://user-images.githubusercontent.com/2537958/150162294-2917e7b1-40dd-444a-ac84-a80a1fd829a9.png)

**Usage:**
----------
This is a console application. All commands can be viewed by calling the help by typing 'node main -h'.
For convenience, you can output the results to a file by redirecting the output. For example: node -v -w > wordcount.log


