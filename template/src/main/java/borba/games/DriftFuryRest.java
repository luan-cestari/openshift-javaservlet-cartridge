package borba.games;

import com.google.common.cache.*;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DriftFuryRest extends HttpServlet {

    protected static final LoadingCache<String, Race> racesSession; // cache that work like a non-persisted DB
    protected static final Map<String, String> identityKeysMap; //working with weak ref to avoid JVM run out memory
    protected static final Logger logger = Logger.getLogger(DriftFuryRest.class.getName());
    protected static final Pattern pattern = Pattern.compile("/api/races/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"); // UID pattern
    static {
        racesSession = CacheBuilder.newBuilder()
                .weakKeys() //free memory if needed
                .concurrencyLevel(10) // handle 10 concurrent request without a problem
                .maximumSize(300) // Hold 300 sessions before remove them
                .expireAfterWrite(30, TimeUnit.DAYS) // If the session is inactive for more than 30 days, remove it
                .removalListener(
                        new RemovalListener<String, Race>() {
                            {
                                logger.info("Removal Listener created");
                            }

                            public void onRemoval(RemovalNotification notification) {
                                logger.info("This data from " + notification.getKey() + " evacuated due:" + notification.getCause());
                                identityKeysMap.remove(notification.getKey());
                            }
                        }
                ).build(
                        new CacheLoader<String, Race>() {
                            public Race load(String key) {
                                return new Race(key);
                            }
                        });
        identityKeysMap = new HashMap<>();
    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        handle(request,response);
    }

    public void handle(HttpServletRequest request,
                       HttpServletResponse response)

            throws IOException, ServletException {

        String path = request.getRequestURI();
        logger.fine(path);

        PrintWriter writer = response.getWriter();
        if (path.startsWith("/api")) {
            logger.info("racesSession before "+new Gson().toJson(racesSession.asMap()));
            handleAPI(request, response, path, writer);
            logger.info("racesSession after "+new Gson().toJson(racesSession.asMap()));
        } else {
            logger.info("No API route matched'");
            response.setContentType("text/html;charset=utf-8");
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            String s = String.format("<h1>Server is UP!</h1>\n<h1>The Path of this request is:'%s'</h1>", path);
            writer.println(s);
            response.setContentLength(s.length()+1);
        }
    }

    private void handleAPI( HttpServletRequest request, HttpServletResponse response, String path, PrintWriter writer) throws IOException {
        response.setContentType("application/json");
        String method = request.getMethod();

        //uma para criar
        if (path.equals("/api/races/create") && "POST".equals(method)) {
            createRace( response, writer);
            return;
            //uma para listar corridas
        } else if(path.equals("/api/races") && "GET".equals(method)) {
            queryAllRace( response, writer);
            return;
        } else{
            Matcher matcher = pattern.matcher(path);

            //uma para atualizar corrida // uma para finalizar a segunda corrida
            if(path.startsWith("/api/races/") && "POST".equals(method) && matcher.find()) {
                updateRace( request, response, writer, matcher);
                return;

                //uma para pegar uma corrida, finalizada ou nao
            } else if(path.startsWith("/api/races/") && "GET".equals(method) && matcher.find()) {
                querySingleRace( response, writer, matcher);
                return;
            } else {
                logger.log(Level.SEVERE, "Invalid request");
                setBadRequestHandled( response);
            }
        }
    }

    private void querySingleRace( HttpServletResponse response, PrintWriter writer, Matcher matcher) {
        String sessionKey = matcher.group(1);
        logger.info(String.format("Session key to be queried-> '%s'", sessionKey));
        sessionKey = identityKeysMap.get(sessionKey);
        if(sessionKey == null){
            logger.log(Level.SEVERE, "Invalid request");
            setBadRequestHandled( response);
            return;
        }
        Race race = racesSession.getIfPresent(sessionKey);
        if(race == null){
            logger.log(Level.SEVERE, "Invalid request");
            setBadRequestHandled( response);
        } else {
            try {
                race = racesSession.get(sessionKey);
            } catch (ExecutionException e) {
                logger.log(Level.SEVERE, "Not able to get from cache", e);

                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }
            Gson gson = new Gson();
            String s = gson.toJson(race);
            writer.println(s);
            response.setContentLength(s.length()+1);
            response.setStatus(HttpServletResponse.SC_OK);

        }
    }

    private void updateRace( HttpServletRequest request, HttpServletResponse response, PrintWriter writer, Matcher matcher) throws IOException {
        String sessionKey = matcher.group(1);
        logger.info(String.format("Session key to be updated-> '%s'", sessionKey));
        sessionKey = identityKeysMap.get(sessionKey);
        if(sessionKey == null){
            logger.log(Level.SEVERE, "Invalid request");
            setBadRequestHandled( response);
            return;
        }
        Race race = racesSession.getIfPresent(sessionKey);
        if( race == null || Status.NEW.equals(race.getStatus()) ) {
            logger.log(Level.SEVERE, "Invalid request");
            setBadRequestHandled( response);
        } else {
            BufferedReader reader = request.getReader();
            Gson gson = new Gson();
            Race requestRace = gson.fromJson(reader, Race.class);
            if(requestRace == null || requestRace.getSessionKey() == null || !requestRace.getSessionKey().equals(sessionKey)){
                logger.log(Level.SEVERE, "Invalid request");
                setBadRequestHandled( response);
                return;
            }

            if (race.getFirstRaceDots() == null) {
                if(requestRace.getFirstRaceDots() == null || requestRace.getFirstRaceDots().isEmpty()){
                    logger.log(Level.SEVERE, "Invalid request");
                    setBadRequestHandled( response);
                    return;
                }
                race.lock.lock();
                try {
                    race.setFirstRaceDots(requestRace.getFirstRaceDots());
                    race.setStatus(Status.FIRST_RACE);
                    race.setPlayerOneName(requestRace.getPlayerOneName());
                } finally {
                    race.lock.unlock();
                }
            } else if (race.getSecondRaceDots() == null) {
                if(requestRace.getSecondRaceDots() == null || requestRace.getSecondRaceDots().isEmpty()){
                    logger.log(Level.SEVERE, "Invalid request");
                    setBadRequestHandled( response);
                    return;
                }
                race.lock.lock();
                try {
                    race.setSecondRaceDots(requestRace.getSecondRaceDots());
                    race.setStatus(Status.FINISHED);
                    race.setPlayerTwoName(requestRace.getPlayerTwoName());
                } finally {
                    race.lock.unlock();
                }
            } else {
                logger.log(Level.SEVERE, "Invalid request");
                setBadRequestHandled(response);
                return;
            }

            String s = gson.toJson(race);
            writer.println(s);
            response.setContentLength(s.length()+1);
            response.setStatus(HttpServletResponse.SC_OK);

        }
    }

    private void setBadRequestHandled( HttpServletResponse response) {

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    }

    private void queryAllRace( HttpServletResponse response, PrintWriter writer) {
        logger.info("Query all races'");
        Iterator<Race> iter = racesSession.asMap().values().iterator();
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("{ \"races\":[");
        boolean firstPassed = false;
        Gson gson = new Gson();
        while (iter.hasNext()) {
            if(firstPassed){
                stringBuilder.append(",");
            }
            Race race = iter.next();
            String s = gson.toJson(race);
            stringBuilder.append(s);
            firstPassed = true;
        }
        stringBuilder.append("]}");
        String s = stringBuilder.toString();
        writer.println(s);
        response.setContentLength(s.length()+1);

        response.setStatus(HttpServletResponse.SC_OK);

    }

    private void createRace( HttpServletResponse response, PrintWriter writer) {
        String sessionKey = UUID.randomUUID().toString();
        logger.info(String.format("New session key -> '%s'", sessionKey));

        Race race;
        try {
            race = racesSession.get(sessionKey);
            identityKeysMap.put(sessionKey,sessionKey);
        } catch (ExecutionException e) {
            logger.log(Level.SEVERE, "Invalid request");
            setBadRequestHandled( response);
            return;
        }
        Gson gson = new Gson();
        String s = gson.toJson(race);
        race.setStatus(Status.CREATED);
        writer.println(s);
        response.setContentLength(s.length()+1);
        response.setStatus(HttpServletResponse.SC_CREATED);

    }

    public enum Status {
        NEW,CREATED,FIRST_RACE,FINISHED
    }

    public static class Race {
        private final transient Lock lock = new ReentrantLock();
        private String sessionKey;
        private Status status = Status.NEW;
        private String playerOneName;
        private String playerTwoName;
        private List<String> firstRaceDots;
        private List<String> secondRaceDots;

        public Race(String key) {
            this.sessionKey = key;
        }

        public String getSessionKey() {
            return sessionKey;
        }

        public void setSessionKey(String sessionKey) {
            this.sessionKey = sessionKey;
        }

        public List<String> getFirstRaceDots() {
            return firstRaceDots;
        }

        public void setFirstRaceDots(List<String> firstRaceDots) {
            this.firstRaceDots = firstRaceDots;
        }

        public List<String> getSecondRaceDots() {
            return secondRaceDots;
        }

        public void setSecondRaceDots(List<String> secondRaceDots) {
            this.secondRaceDots = secondRaceDots;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Race race = (Race) o;

            return sessionKey.equals(race.sessionKey);

        }

        @Override
        public int hashCode() {
            return sessionKey.hashCode();
        }

        public Status getStatus() {
            return status;
        }

        public void setStatus(Status status) {
            this.status = status;
        }

        public String getPlayerTwoName() {
            return playerTwoName;
        }

        public void setPlayerTwoName(String playerTwoName) {
            this.playerTwoName = playerTwoName;
        }

        public String getPlayerOneName() {
            return playerOneName;
        }

        public void setPlayerOneName(String playerOneName) {
            this.playerOneName = playerOneName;
        }
    }
}
